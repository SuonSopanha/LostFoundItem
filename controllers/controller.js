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
const moment = require('moment');

const item = require("../models/item");
const user = require("../models/user");
const message = require('../models/message');

const NodeGeocoder = require("node-geocoder");

dotenv.config();



Bucket_Name = process.env.bucket_name;
Bucket_Region = process.env.aws_region;
Access_key_Id = process.env.aws_access_key_id;
Secret_Access_Key = process.env.aws_secret_access_key;

const randomImageName = (bytes = 32) =>
  crypto.randomBytes(bytes).toString("hex");

const s3 = new S3Client({
  credential: {
    accessKeyId: Access_key_Id,
    secretAccessKey: Secret_Access_Key,
  },
  region: Bucket_Region,
});

function checkSignIn() {
  if (req.user !== undefined) return true;
  else return false;
}

exports.postForm = async (req, res) => {
  try {
    const buffer = await sharp(req.file.buffer)
      .resize({ width: 500, height: 500 })
      .toBuffer();
    const imageName = randomImageName();

    const params = {
      Bucket: Bucket_Name,
      Key: imageName,
      Body: buffer,
      ContentType: req.file.mimetype,
    };

    const command = new PutObjectCommand(params);

    await s3.send(command);

    const items = new item({
      itemName: req.body.itemname,
      category: req.body.category,
      color: req.body.color,
      secondaryColor: req.body.secondarycolor,
      size: req.body.size,
      date: req.body.date,
      time: req.body.time,
      description: req.body.description,
      location: req.body.location,
      image: imageName,
      username: req.user.name,
      email: req.user.email,
      phone: req.body.mobile,
      itemStatus: req.body.itemstatus,
    });
    await items.save();


    if (req.body.itemstatus == "lost") {
      res.redirect("/lostItemPage");
    } else {
      res.redirect("/foundItemPage");
    }
  } catch (error) {
    console.error(error);
    // Handle the error, such as sending an error response or redirecting to an error page
    res.render("error", { error: error });
  }
};

//----------------------------------------------------------------------------------//

//homepage
exports.homepage = (req, res) => {
  if (req.user !== undefined) {
    res.render("homepage", { isAuth: true });
  } else {
    res.render("homepage", { isAuth: false });
  }
};

//lostItemPage

exports.lostItemPage = async (req, res) => {
  try {
    const itemsPerPage = 9; // Change this to the desired number of items per page
    const page = req.query.page ? parseInt(req.query.page) : 1;

    const count = await item.countDocuments({ itemStatus: "lost" });
    const totalPages = Math.ceil(count / itemsPerPage);
    const skip = (page - 1) * itemsPerPage;

    const lostItems = await item
      .find({ itemStatus: "lost" })
      .sort({ _id: -1 })
      .skip(skip)
      .limit(itemsPerPage);

    for (const lostItem of lostItems) {
      const getObjectParams = {
        Bucket: Bucket_Name,
        Key: lostItem.image,
      };

      const command = new GetObjectCommand(getObjectParams);
      const url = await getSignedUrl(s3, command, { expriresIn: 3600 });
      lostItem.image = url;
    }

    function checkSignIn() {
      return req.user !== undefined;
    }

    res.render("lostItemPage", {
      isAuth: checkSignIn(),
      data: lostItems,
      totalPages: totalPages,
      currentPage: page,
    });
  } catch (error) {
    console.error(error);
    // Handle the error, such as sending an error response or redirecting to an error page
    res.render("error", { error: error });
  }
};

//foundItemPage
exports.foundItemPage = async (req, res) => {
  try {
    const itemsPerPage = 9; // Change this to the desired number of items per page
    const page = req.query.page ? parseInt(req.query.page) : 1;

    const count = await item.countDocuments({ itemStatus: "found" });
    const totalPages = Math.ceil(count / itemsPerPage);
    const skip = (page - 1) * itemsPerPage;

    const FoundItems = await item
      .find({ itemStatus: "found" })
      .sort({ _id: -1 })
      .skip(skip)
      .limit(itemsPerPage);

    for (const item of FoundItems) {
      const getObjectParams = {
        Bucket: Bucket_Name,
        Key: item.image,
      };

      const command = new GetObjectCommand(getObjectParams);
      const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
      item.image = url;
    }

    function checkSignIn() {
      if (req.user !== undefined) return true;
      else return false;
    }

    res.render("foundItemPage", {
      isAuth: checkSignIn(),
      data: FoundItems,
      totalPages: totalPages,
      currentPage: page,
    });
  } catch (error) {
    console.error(error);
    // Handle the error, such as sending an error response or redirecting to an error page
    res.render("error", { error: error });
  }
};

//signInPage
exports.signInPage = (req, res) => {
  function checkSignIn() {
    if (req.user !== undefined) return true;
    else return false;
  }
  res.render("signInPage",{isAuth : checkSignIn()});
};

//signUpPage
exports.signUpPage = (req, res) => {
  const error = false;
  function checkSignIn() {
    if (req.user !== undefined) return true;
    else return false;
  }

  res.render("signUpPage", { error: error ,isAuth : checkSignIn() });
};

//login
exports.login = (req, res) => {
  function checkSignIn() {
    if (req.user !== undefined) return true;
    else return false;
  }
  res.render("signInPage",{isAuth : checkSignIn()});
};

exports.loginFailed = (req, res) => {
  function checkSignIn() {
    if (req.user !== undefined) return true;
    else return false;
  }

  res.render("loginFailed", {
    error: true,
    message: "Incorrect Password of Email",
    isAuth: checkSignIn(),
  });
};

//login success
exports.LoginSuc = (req, res) => {
  function checkSignIn() {
    if (req.user !== undefined) return true;
    else return false;
  }

  res.render("LoginSuc", { username: req.user.name , isAuth: checkSignIn() });
};

//signup success
exports.signupSuc = (req, res) => {
  function checkSignIn() {
    if (req.user !== undefined) return true;
    else return false;
  }
  
  res.render("signupSuc",{ isAuth: checkSignIn()});
};

//form
exports.form = (req, res) => {
  function checkSignIn() {
    if (req.user !== undefined) return true;
    else return false;
  }
  res.render("form",{isAuth: checkSignIn()});
};

// item detail
exports.itemDetail = async (req, res) => {
  try {
    const itemdata = await item.findById(req.params.id);

    const getObjectParams = {
      Bucket: Bucket_Name,
      Key: itemdata.image,
    };
    const command = new GetObjectCommand(getObjectParams);
    const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
    itemdata.image = url;

    const options = {
      provider: "openstreetmap",
    };
    const geocoder = NodeGeocoder(options);
    const address = itemdata.location;
    const coordinate = [];
    const geocodeResult = await geocoder.geocode(address);
    console.log(geocodeResult[0]);
    const lat = geocodeResult[0].latitude;
    coordinate.push(lat);
    const long = geocodeResult[0].longitude;
    coordinate.push(long);

    const userAccount = await user.find({name : itemdata.username});
    const userAccountId = userAccount[0]._id.toString();
    console.log(userAccountId);

    function checkSignIn() {
      if (req.user !== undefined) return true;
      else return false;
    }

    res.render("itemDetail", {
      data: itemdata,
      coordinate: coordinate,
      address: geocodeResult[0].formattedAddress,
      messageID : userAccountId,
      isAuth: checkSignIn(),
    });
  } catch (err) {
    console.error(err);
    res.render("error", { error: error });
  }
};

//search
exports.search = async (req, res) => {
  try {
    console.log(req.query.search);

    if (req.query.category != undefined) {
      res.redirect(`/searchCat/${req.query.category}`);
    } else if (req.query.search != "") {
      const search = req.query.search;
      const itemsPerPage = 7; // Change this to the desired number of items per page
      const page = req.query.page ? parseInt(req.query.page) : 1;

      const count = await item.countDocuments({
        itemName: { $regex: search, $options: "i" },
      });
      const totalPages = Math.ceil(count / itemsPerPage);
      const skip = (page - 1) * itemsPerPage;

      const searchItem = await item
        .find({ itemName: { $regex: search, $options: "i" } })
        .sort({ _id: -1 })
        .skip(skip)
        .limit(itemsPerPage);

      for (const item of searchItem) {
        const getObjectParams = {
          Bucket: Bucket_Name,
          Key: item.image,
        };

        const command = new GetObjectCommand(getObjectParams);
        const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
        item.image = url;
      }

      function checkSignIn() {
        if (req.user !== undefined) return true;
        else return false;
      }

      res.render("foundItemPage", {
        isAuth: checkSignIn(),
        data: searchItem,
        totalPages: totalPages,
        currentPage: page,
      });
    }
  } catch (error) {
    console.error(error);
    // Handle the error, such as sending an error response or redirecting to an error page
    res.render("error", { error: error });
  }
};

//serach
exports.searchCat = async (req, res) => {
  try {
    console.log(req.params.category);
    const search = req.params.category;
    const itemsPerPage = 7; // Change this to the desired number of items per page
    const page = req.query.page ? parseInt(req.query.page) : 1;

    const count = await item.countDocuments({
      category: { $regex: search, $options: "i" },
    });
    const totalPages = Math.ceil(count / itemsPerPage);
    const skip = (page - 1) * itemsPerPage;

    const searchItem = await item
      .find({ category: { $regex: search, $options: "i" } })
      .sort({ _id: -1 })
      .skip(skip)
      .limit(itemsPerPage);

    for (const item of searchItem) {
      const getObjectParams = {
        Bucket: Bucket_Name,
        Key: item.image,
      };

      const command = new GetObjectCommand(getObjectParams);
      const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
      item.image = url;
    }

    function checkSignIn() {
      if (req.user !== undefined) return true;
      else return false;
    }

    res.render("foundItemPage", {
      isAuth: checkSignIn(),
      data: searchItem,
      totalPages: totalPages,
      currentPage: page,
    });
  } catch (error) {
    console.error(error);
    // Handle the error, such as sending an error response or redirecting to an error page
    res.render("error", { error: error });
  }
};

exports.profile = async (req, res) => {
  try {
    const adminUsername = ["suonsopanha"];
    const adminEmail = ["sounsopanha168@gmail.com"];

    if (
      adminUsername.includes(req.user.name) &&
      adminEmail.includes(req.user.email)
    ) {
      res.redirect("/admin/overview");
    } else {
      const username = req.user.name;
      const userID = req.user._id;
      console.log(userID);
      const FoundItems = await item.find({
        itemStatus: "found",
        username: username,
      });
      const lostItems = await item.find({
        itemStatus: "lost",
        username: username,
      });

      function checkSignIn() {
        if (req.user !== undefined) return true;
        else return false;
      }

      res.render("userProfile", {
        data: FoundItems,
        data_two: lostItems,
        username: username,
        userID: userID,
        isAuth: checkSignIn(),
      });
    }
  } catch (error) {
    console.error(error);
    // Handle the error, such as sending an error response or redirecting to an error page
    res.render("error", { error: error });
  }
};

exports.adminAccount = async (req, res) => {
  try {
    const itemsPerPage = 10; // Change this to the desired number of items per page
    const page = req.query.page ? parseInt(req.query.page) : 1;

    const count = await user.countDocuments();
    const totalPages = Math.ceil(count / itemsPerPage);
    const skip = (page - 1) * itemsPerPage;

    const userProfile = await user
      .find()
      .sort({ _id: -1 })
      .skip(skip)
      .limit(itemsPerPage);

    function checkSignIn() {
      if (req.user !== undefined) return true;
      else return false;
    }

    const itemCount = await item.countDocuments();
    const lostCount = await item.countDocuments({ itemStatus: "lost" });
    const foundCount = await item.countDocuments({ itemStatus: "found" });

    const reportCount = [];
    let number = 0;

    for (let i = 0; i < userProfile.length; i++) {
      number = await item.countDocuments({ username: userProfile[i].name });
      reportCount.push(number);
    }

    res.render("AdminAccount", {
      isAuth: checkSignIn(),
      data: userProfile,
      totalPages: totalPages,
      currentPage: page,
      itemCount: itemCount,
      lostCount: lostCount,
      foundCount: foundCount,
      userCount: count,
      reportCount: reportCount,
    });
  } catch (error) {
    console.error(error);
    // Handle the error, such as sending an error response or redirecting to an error page
    res.render("error", { error: error });
  }
};

exports.adminReport = async (req, res) => {
  try {
    const itemsPerPage = 10; // Change this to the desired number of items per page
    const page = req.query.page ? parseInt(req.query.page) : 1;

    const count = await item.countDocuments();
    const totalPages = Math.ceil(count / itemsPerPage);
    const skip = (page - 1) * itemsPerPage;

    const FoundItems = await item
      .find()
      .sort({ _id: -1 })
      .skip(skip)
      .limit(itemsPerPage);

    function checkSignIn() {
      if (req.user !== undefined) return true;
      else return false;
    }

    const lostCount = await item.countDocuments({ itemStatus: "lost" });
    const foundCount = await item.countDocuments({ itemStatus: "found" });
    const userCount = await user.countDocuments();

    res.render("adminitemReport", {
      isAuth: checkSignIn(),
      data: FoundItems,
      totalPages: totalPages,
      currentPage: page,
      itemCount: count,
      lostCount: lostCount,
      foundCount: foundCount,
      userCount: userCount,
    });
  } catch (error) {
    console.error(error);
    // Handle the error, such as sending an error response or redirecting to an error page
    res.render("error", { error: error });
  }
};

exports.adminOverview = async (req, res) => {
  try {
    const itemsPerPage = 10; // Change this to the desired number of items per page
    const page = req.query.page ? parseInt(req.query.page) : 1;

    const count = await item.countDocuments();
    const totalPages = Math.ceil(count / itemsPerPage);
    const skip = (page - 1) * itemsPerPage;

    const FoundItems = await item
      .find()
      .sort({ _id: -1 })
      .skip(skip)
      .limit(itemsPerPage);

    function checkSignIn() {
      if (req.user !== undefined) return true;
      else return false;
    }

    const lostCount = await item.countDocuments({ itemStatus: "lost" });
    const foundCount = await item.countDocuments({ itemStatus: "found" });
    const userCount = await user.countDocuments();

    res.render("adminOverview", {
      isAuth: checkSignIn(),
      data: FoundItems,
      totalPages: totalPages,
      currentPage: page,
      itemCount: count,
      lostCount: lostCount,
      foundCount: foundCount,
      userCount: userCount,
    });
  } catch (error) {
    console.error(error);
    // Handle the error, such as sending an error response or redirecting to an error page
    res.render("error", { error: error });
  }
};

exports.logout = (req, res) => {
  req.logout((err) => {
    if (err) {
      console.log(err);
    }
    res.redirect("/");
  });
};

exports.formEdit = async (req, res) => {
  const itemdata = await item.findById(req.params.id);

  function checkSignIn() {
    if (req.user !== undefined) return true;
    else return false;
  }

  res.render("editForm", { data: itemdata , isAuth: checkSignIn()});
};

exports.edit = async (req, res) => {
  const itemId = req.params.id;
  console.log(itemId);
  console.log(req.body);

  try {
    await item
      .findByIdAndUpdate(itemId, {
        itemName: req.body.itemname,
        category: req.body.category,
        color: req.body.color,
        secondaryColor: req.body.secondarycolor,
        size: req.body.size,
        date: req.body.date,
        time: req.body.time,
        description: req.body.description,
        location: req.body.location,
        username: req.user.name,
        email: req.user.email,
        phone: req.body.mobile,
        itemStatus: req.body.itemstatus,
      })
      .exec();

    res.redirect("/");
  } catch (error) {
    console.error(error);
    // Handle the error, such as sending an error response or redirecting to an error page
    res.render("error", { error: error });
  }
};

exports.delete = async (req, res) => {
  const itemId = req.params.id;
  const items = await item.findById(itemId);
  if(items){
    try {
      await item.findByIdAndRemove(itemId);
  
      res.redirect("/");
    } catch (err) {
      console.log(err);
      next(err);
    }
  }else{
    res.redirect("/");
  }
  
};

exports.message = async (req, res) => {
  const userId = req.user.id;
  function checkSignIn() {
    if (req.user !== undefined) return true;
    else return false;
  }

  try {
    const existingMessage = await message.find({
      $or: [
        { 'account1.accountID': userId },
        { 'account2.accountID': userId }
      ]
    });

    let messagePersonList = [];
    let textList = [];
    let detailsList = [];
    if (existingMessage) {
      console.log(existingMessage);
      for (let i = 0; i < existingMessage.length; i++) {
        let messagePerson;
        let detailID;
        if (existingMessage[i].account1.accountID == userId) {
          messagePerson = existingMessage[i].account2.username;
          detailID = existingMessage[i].account2.accountID;
        } else if (existingMessage[i].account2.accountID == userId) {
          messagePerson = existingMessage[i].account1.username;
          detailID = existingMessage[i].account1.accountID;
        }
        textList.push(
          existingMessage[i].messageContent[
            existingMessage[i].messageContent.length - 1
          ].text
        );
        messagePersonList.push(messagePerson);
        detailsList.push(detailID);
      }
      console.log(textList, messagePersonList);
      res.render("message", {
        data: existingMessage,
        textList: textList,
        messagePersonList: messagePersonList,
        detailID: detailsList,
        isAuth : true
      });
    } else {
      res.render("message", { data: null , isAuth: true });
    }
  } catch (error) {
    console.error(error);
    // Handle the error, such as sending an error response or redirecting to an error page
    res.render("error", { error: error });
  }
};


exports.messageBody = async (req, res) => {
  const receiverID = req.params.id;

  const sender = req.user.id;
  const receiver = receiverID;

  const senderAccount = await user.findById(sender);
  const receiverAccount = await user.findById(receiver);

  const senderUsername = senderAccount.name;
  const receiverUsername = receiverAccount.name;

  console.log(sender, receiver);

  function checkSignIn() {
    if (req.user !== undefined) return true;
    else return false;
  }

  try {
    const existingMessage = await message.findOne({
      $or: [
        { 'account1.accountID': sender, 'account2.accountID': receiver },
        { 'account1.accountID': receiver, 'account2.accountID': sender }
      ]
    });

    if (existingMessage) {
      console.log(existingMessage);
      let senderList = [];
      let receiverList = [];

      for (let i = 0; i < existingMessage.messageContent.length; i++) {
        if (existingMessage.messageContent[i].accountID == sender) {
          existingMessage.messageContent[i].side = 0;
        } else {
          existingMessage.messageContent[i].side = 1;
        }
      }

      res.render("messageBody", {
        receiverID: req.params.id,
        receiverUsername: receiverUsername,
        senderUsername: senderUsername,
        messageContent: existingMessage.messageContent,
        isAuth : true,
      });
    } else {
      res.render("blandMessage", { 
        receiverID: req.params.id,
        isAuth: true,
        receiverUsername: receiverUsername,
        senderUsername: senderUsername 
       });
    }
  } catch (error) {
    console.error(error);
    // Handle the error, such as sending an error response or redirecting to an error page
    res.render("error", { error: error });
  }
};


exports.send_message = async (req, res) => {
  
  const receiverID = req.params.id;
  const receiverAccount = await user.findById(receiverID);
  const receiverUsername = receiverAccount.name;
  const sender = req.user.id;
  const receiver = receiverID;
  console.log(sender, receiver);

  try {
    const existingMessage = await message.findOne({
      $or: [
        { 'account1.accountID': sender, 'account2.accountID': receiver },
        { 'account1.accountID': receiver, 'account2.accountID': sender }
      ]
    });

    const formattedDate = moment().format('hh:mm A DD-MM-YYYY');

    if (existingMessage) {
      // Update existing message
      existingMessage.messageContent.push({
        text: req.body.message,
        date: formattedDate,
        accountID: sender
      });

      await existingMessage.save();
      res.redirect(`/messageBody/${receiverID}`);
    } else {
      // Create new message
      const newMessage = new message({
        account1: { accountID: sender, username: req.user.name },
        account2: { accountID: receiverID, username: receiverUsername },
        messageContent: [
          {
            text: req.body.message,
            date: formattedDate,
            accountID: sender
          }
        ]
      });

      await newMessage.save();
      res.redirect(`/messageBody/${receiverID}`);
    }
  } catch (error) {
    console.error(error);
    // Handle the error, such as sending an error response or redirecting to an error page
    res.render("error", { error: error });
  }
};

exports.changeName = async (req, res) => {
  const userID = req.user._id;
  const newUsername = req.body.changename

  try {
    await user.findByIdAndUpdate(userID, { name: newUsername });
    res.redirect("/profile");
  }
  catch (error) {
    console.error(error);
    // Handle the error, such as sending an error response or redirecting to an error page
    res.render("error", { error: error });
  }
}


