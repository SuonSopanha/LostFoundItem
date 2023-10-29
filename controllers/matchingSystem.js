const dotenv = require("dotenv");
const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} = require("@aws-sdk/client-s3");

const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const crypto = require("crypto");
const sharp = require("sharp");
const flash = require("connect-flash");
const moment = require("moment");

const item = require("../models/item");
const user = require("../models/user");
const message = require("../models/message");

dotenv.config();

const s3 = new S3Client({
  credential: {
    accessKeyId: Access_key_Id,
    secretAccessKey: Secret_Access_Key,
  },
  region: Bucket_Region,
});

////function

//shingle text into array
function shingle(text, k) {
  let shingleSet = [];
  for (let i = 0; i < text.length - k + 1; i++) {
    //push the slice of text from i to i+k to shigleSet

    shingleSet.push(text.slice(i, i + k));
  }
  //remove duplicates
  shingleSet = [...new Set(shingleSet)];

  return shingleSet;
}

//universal union

function getUniversalSet(sets) {
  // Create an empty set to store the union
  let universalSet = new Set();

  // Iterate over each set in the list
  sets.forEach((set) => {
    // Iterate over each element in the current set
    set.forEach((element) => {
      // Add the element to the universal set
      universalSet.add(element);
    });
  });
  universalSet = [...new Set(universalSet)];
  return universalSet;
}

//shuffle hash table index
function shuffle(array) {
  //generate random number

  for (let i = 0; i < array.length - 1; i++) {
    let randomIndex = Math.floor(Math.random() * array.length);
    let temp = array[i];
    array[i] = array[randomIndex];
    array[randomIndex] = temp;
  }
  return array;
}

// Creates a MinHash function with the specified size
function createMinHash(size) {
    // Create an array of numbers from 1 to size
    let hash_ex = Array.from({ length: size }, (_, index) => index + 1);
    // Shuffle the array to create a random permutation
    hash_ex = shuffle(hash_ex);
  
    return hash_ex;
  }
  
  // Generates multiple random permutation hashes using createMinHash function
  function buildMinHashes(universalSize, numberOfHashes) {
    let hashes = [];
    for (let i = 0; i < numberOfHashes; i++) {
      // Create a new MinHash for each hash
      hashes.push(createMinHash(universalSize));
    }
  
    return hashes;
  }
  
  // Creates a signature for a given list using the MinHashes and universalLength
  function createSignature(list, minHashes_func, universalLength) {
    let signature = [];
    for (let i = 0; i < minHashes_func.length; i++) {
      for (let j = 1; j < universalLength + 1; j++) {
        // Find the index of j in the MinHash
        let index = minHashes_func[i].indexOf(j);
        // Get the value at that index from the list
        let signatureValue = list[index];
        // If the value is 1, add the index to the signature
        if (signatureValue == 1) {
          signature.push(index);
          break;
        }
      }
    }
  
    return signature;
  }
  
  // Finds the union of two sets (shingle sets)
  function union(shingleSet1, shingleSet2) {
    return [...new Set(shingleSet1.concat(shingleSet2))];
  }
  
  // Finds the intersection of two sets (shingle sets)
  function intersection(shingleSet1, shingleSet2) {
    return shingleSet1.filter((x) => shingleSet2.includes(x));
  }
  
  // Calculates the Jaccard similarity coefficient between two lists (set representation)
  function jaccard(listA, listB) {
    const setA = new Set(listA);
    const setB = new Set(listB);
  
    // Find the intersection of the two sets
    const intersection = new Set(
      [...setA].filter((element) => setB.has(element))
    );
    // Find the union of the two sets
    const union = new Set([...setA, ...setB]);
  
    // Calculate and return the Jaccard similarity coefficient
    return intersection.size / union.size;
  }

exports.matchingFucntion = async (req, res) => {
  // Retrieve a list of items belonging to the user from the database
  const userItemsReport = await item.find({ username: req.user.name });

  // Initialize an array to store the matching values
  let matchValue = [];
  let matchingCandidate = [];

  // Iterate over each item in the user's item report
  for (let i = 0; i < userItemsReport.length; i++) {
    let itemlist;

    // Check if the item status is "found"
    if (userItemsReport[i].itemStatus === "found") {
      // Search for items with the same category and "lost" status
      itemList = await item.find({
        category: userItemsReport[i].category,
        itemStatus: "lost",
      });
    } else {
      // Search for items with the same category and "found" status
      itemList = await item.find({
        category: userItemsReport[i].category,
        itemStatus: "found",
      });
    }

    matchingCandidate.push(itemList);
    let list = [];

    // Create a string representing the main item by combining its properties
    let mainItem =
      userItemsReport[i].itemName +
      userItemsReport[i].color +
      userItemsReport[i].secondaryColor +
      userItemsReport[i].description +
      userItemsReport[i].location;

    // Add the main item to the list
    list.push(mainItem);

    // Iterate over the items in the itemList
    for (let i = 0; i < itemList.length; i++) {
      // Createa string representation of each item in the itemList
      let string =
        itemList[i].itemName +
        itemList[i].color +
        itemList[i].secondaryColor +
        itemList[i].description +
        itemList[i].location;
      // Add the string representation to the list
      list.push(string);
    }

    let shingleSet = [];

    // Convert each string in the list to shingles and add them to the shingleSet
    for (let i = 0; i < list.length; i++) {
      shingleSet.push(shingle(list[i], 2));
    }

    // Get the universal set of shingles from the shingleSet
    const universalSet = getUniversalSet(shingleSet);

    let oneHotList = [];

    // Convert each shingle set into a one-hot encoding
    for (let i = 0; i < shingleSet.length; i++) {
      let oneHot;
      oneHot = universalSet.map((element) =>
        shingleSet[i].includes(element) ? 1 : 0
      );
      // Add the one-hot encoding to the oneHotList
      oneHotList.push(oneHot);
    }

    // Generate minhash permutations
    let minhashPermutaion = buildMinHashes(universalSet.length, 1000);
    let signaturelist = [];

    // Create a signature for each one-hot encoding using minhash
    for (let i = 0; i < oneHotList.length; i++) {
      let signature;
      signature = createSignature(
        oneHotList[i],
        minhashPermutaion,
        universalSet.length
      );
      // Add the signature to the signaturelist
      signaturelist.push(signature);
    }

    let compareValue = [];

    // Calculate Jaccard similarity between the first item's signature and the rest
    for (let i = 1; i < signaturelist.length; i++) {
      compareValue.push(jaccard(signaturelist[0], signaturelist[i]));
    }

    // Add the compareValue array to the matchValue array
    matchValue.push(compareValue);
  }

  // Log the matchValue array to the console
  for (let i = 0; i < userItemsReport.length; i++) {
    console.log(userItemsReport[i].itemName, ' :');
    for (let j = 0; j < matchingCandidate[i].length; j++) {
        console.log(
          matchingCandidate[i][j].itemName,
          ' :',
          matchValue[i][j]
        );
        matchingCandidate[i][j].matchValue = matchValue[i][j];
        console.log(matchingCandidate[i][j].matchValue);
    }
    console.log('\n\n');
  }

  // Sort the matchingCandidate array by matchValue
  for(let i = 0; i < matchingCandidate.length; i++){
     matchingCandidate[i].sort((a, b) => {
       return b.matchValue - a.matchValue
     })
  }

  let potentailMatchItems = [];
  for(let i = 0; i < matchingCandidate.length; i++){
    let list = [];
    for(let j = 0; j < matchingCandidate[i].length; j++){

      if(matchingCandidate[i][j].matchValue >= 0.40){
        list.push(matchingCandidate[i][j]);
      }
      
    }
    potentailMatchItems.push(list);
  }


  for(let i = 0; i < potentailMatchItems.length;i++){

    for (const lostItem of potentailMatchItems[i]) {
      const getObjectParams = {
        Bucket: Bucket_Name,
        Key: lostItem.image,
      };
  
      const command = new GetObjectCommand(getObjectParams);
      const url = await getSignedUrl(s3, command, { expriresIn: 3600 });
      lostItem.image = url;
    }

  }
  

  function checkSignIn() {
    return req.user !== undefined;
  }

  res.render("matching", {
    isAuth: checkSignIn(),
    data: potentailMatchItems,
    userData: userItemsReport
  });
};
