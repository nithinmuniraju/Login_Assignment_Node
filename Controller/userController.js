const jwt = require('jsonwebtoken');

const db = require("../Models");
const Op = db.Sequelize.Op;
const emailSchems = db.register;

const { encrypt, decrypt, validateEmail, validatePassword } = require('../Utils/helper');

exports.registerUser = async (req, res) => {
    try{
        const { first_name , last_name, email, password, mobile_no, address } = req.body;

        if(!validateEmail(email)) {
            return res.status(400).send({ success: false, message: "Please enter valid email, Ex: test@test.com" });
        }

        if(!validatePassword(password)) {
            return res.status(400).send({ success: false, message: "Please enter password of minimum eight characters, at least one uppercase letter, one lowercase letter, one number and one special character" });
        }

        const hash = encrypt(password);
        const regObj = { first_name , last_name, email, password: hash, mobile_no, address };

        const data = await emailSchems.create(regObj).catch(err => {
            if(err && err.parent && err.parent.sqlMessage) {
                return res.send({
                    success: false,
                    message: err.parent.sqlMessage
                });
            } else {
                return res.send({success: false, message: err.message});
            }
        });
        res.status(200).send({ auth: true, data: data  });
    } catch(err) {
        console.log('UserControllerRegister::Exception ', err)
        res.status(400).send({ success: false, message: "Somthing went wrong!!" });
    }
}

exports.loginUser = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        if(!email || typeof email === "undefined" && email === "") {
            res.status(400).send({ success: false, message: "email field is required"});
        }
        if(!password || typeof password === "undefined" && password === "") {
            res.status(400).send({ success: false, message: "password field is required"});
        }
        const userData = await emailSchems.findOne({
            where: {
              email: email
            }
        });

        if(!userData) {
            res.status(400).send({ success: false, message: "No user data found on email: "+ email});
        } else {
            const getHashedPassword = userData.dataValues.password;
            if(getHashedPassword !== "" && typeof getHashedPassword !== "undefined"){
                const hashedPassword = decrypt(password, getHashedPassword);

                if(hashedPassword) {
                    const token = jwt.sign({ id: email, type: 'User'}, process.env.SECRET, {
                        expiresIn: 86400 // expires in 24 hours
                    });
                    const userObj = JSON.stringify({
                        token: token
                    })
                    req.session.user = userObj;

                    res.status(200).send({ success: true, token: token });
                } else {
                    res.status(400).send({ success: false, message: "Invalid password" });
                }
            }
        }
    } catch(err) {
        console.log('UserControllerLogin::Exception ', err)
        res.status(400).send({ success: false, message: "Somthing went wrong!!" });
    }
}

exports.getAllUsers = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 0;
        const pageSize = parseInt(req.query.limit) || 10;

        if(!req.headers.token || typeof req.headers.token == "undefined" || req.headers.token == ""){
            return res.status(400).send({ success: false, message: "Token field is required" });
        } else {
            const getSessionData = JSON.parse(req.session.user);

            if(getSessionData && getSessionData.token === req.headers.token) {
                try {
                    const decoded = jwt.verify(req.headers.token, process.env.SECRET);
                    if(decoded) {
                        const getUserData = await emailSchems.findOne({
                           where: {
                               email: decoded.id
                           }
                        })

                        if(!getUserData || typeof getUserData === "undefined") {
                            return res.status(400).send({ success: false, message: "Please pass a valid token/No user found on provided token" });
                        }
                        const getAllDetails = await emailSchems.findAndCountAll({
                            offset: page == 0 ? 0 : pageSize * (page - 1),
                            limit: pageSize
                        });
                        let meta = {
                            "page": { 
                                "total_records" : getAllDetails.count,
                                "current_page": page,
                                "page_size": pageSize,
                                "last_page": Math.ceil(getAllDetails.count / pageSize)
                            }
                        }

                        res.status(200).send({ sucess: true, meta: meta, data: getAllDetails});
                    }
                } catch(err) {
                    if(err) {
                        return res.status(400).send({ success: false, message: "Token has been expired/Invalid" });
                    }
                }
            } else {
                return res.status(400).send({ success: false, message: "Token doesn't match/Invalid" });
            }
        }
    } catch(err) {
        console.log('UserControllerGetAll::Exception ', err)
        res.status(400).send({ success: false, message: "Somthing went wrong!!" });
    }
}

exports.updateUser = async (req, res, next) => {
    try {
        const getSessionData = JSON.parse(req.session.user);

        if(!req.headers.token || typeof req.headers.token == "undefined" || req.headers.token == ""){
            return res.status(400).send({ success: false, message: "Token field is required" });
        }
        if(req.headers.token === getSessionData.token) {
            const { first_name , last_name, password, mobile_no, address, email } = req.body;

            if(email) {
                return res.status(400).send({ success: false, message: "Email cannot be updated" });
            }
            if(password && !validatePassword(password)) {
                return res.status(400).send({ success: false, message: "Please enter password of minimum eight characters, at least one uppercase letter, one lowercase letter, one number and one special character" });
            }

            try {
                const decoded = jwt.verify(req.headers.token, process.env.SECRET);
                if(decoded) {
                    const getUserData = await emailSchems.findOne({
                       where: {
                           email: decoded.id
                       }
                    })

                    if(!getUserData || typeof getUserData === "undefined") {
                        return res.status(400).send({ success: false, message: "No user found with email: "+ decoded.id +", Or please login again with updated email"});
                    } else {
                        let hash = "";
                        if(password) {
                            hash = encrypt(password);
                        }

                        const userDataObj = {
                            "first_name": first_name,
                            "last_name": last_name,
                            "password": hash === "" ? getUserData.dataValues.password : hash,
                            "mobile_no": mobile_no,
                            "address": address
                        }
                        const result = await getUserData.update(userDataObj).catch(err => {
                            if(err && err.parent && err.parent.sqlMessage) {
                                return res.send({
                                    success: false,
                                    message: err.parent.sqlMessage
                                });
                            } else {
                                return res.send({success: false, message: err.message});
                            }
                        });
        
                        res.status(200).send({ sucess: true, data: result});
                    }
                }
            } catch(err) {
                console.log(err);
                return res.status(400).send({ success: false, message: "Token has been expired/Invalid or incorrect data" });
            }
        } else {
            return res.status(400).send({ success: false, message: "TToken has been expired/Invalid" });
        }
    } catch(err) {
        console.log('UserControllerUpdateUser::Exception ', err)
        res.status(400).send({ success: false, message: "Somthing went wrong!!" });
    }
}

exports.searchUser = async (req, res, next) => {
    try {
        const getSessionData = JSON.parse(req.session.user);

        if(!req.headers.token || typeof req.headers.token == "undefined" || req.headers.token == "") {
            return res.status(400).send({ success: false, message: "Token is required" });
        }
        if(req.headers.token === getSessionData.token) {
            const {first_name, last_name, email, mobile } = req.query;
            const page = parseInt(req.query.page) || 0;
            const pageSize = parseInt(req.query.limit) || 10;

            let conditionObj = {};

            if(typeof first_name !== "undefined" && first_name !== "") {
                conditionObj = {
                    ...conditionObj,
                    first_name: { [Op.like]: `%${first_name}%` }
                }
            }
            if(typeof last_name !== "undefined" && last_name !== "") {
                conditionObj = {
                    ...conditionObj,
                    last_name: { [Op.like]: `%${last_name}%` }
                }
            }
            if(typeof mobile !== "undefined" && mobile !== "") {
                conditionObj = {
                    ...conditionObj,
                    mobile_no: { [Op.like]: `%${mobile}%` }
                }
            }
            if(typeof email !== "undefined" && email !== "") {
                conditionObj = {
                    ...conditionObj,
                    email: { [Op.like]: `%${email}%` }
                }
            }
            try {
                const decoded = jwt.verify(req.headers.token, process.env.SECRET);
                if(decoded) {
                    const getUserData = await emailSchems.findAndCountAll({
                        where: conditionObj,
                        offset: page == 0 ? 0 : pageSize * (page - 1),
                        limit: pageSize
                    });

                    let meta = {
                        "page": { 
                            "total_records" : getUserData.count,
                            "current_page": page,
                            "page_size": pageSize,
                            "last_page": Math.ceil(getUserData.count / pageSize)
                        }
                    }
                    res.status(200).send({ sucess: true, meta: meta, data: getUserData});
                }
            } catch(err) {
                return res.status(400).send({ success: false, message: "Token has been expired/Invalid" });
            }
        } else {
            return res.status(400).send({ success: false, message: "Token has been expired/Invalid" });
        }
    } catch(err) {
        console.log('UserControllerUpdateUser::Exception ', err)
        res.status(400).send({ success: false, message: "Somthing went wrong!!" });
    }
}