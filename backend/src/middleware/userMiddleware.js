const jwt = require("jsonwebtoken");
const User = require("../models/user");
const redisClient = require("../config/redis")
const {handleError, HttpError} = require("../utils/httpError");

const userMiddleware = async (req,res,next)=>{

    try{
        
        const {token} = req.cookies;
        if(!token)
            throw new HttpError(401, "Token is not present");

        const payload = jwt.verify(token,process.env.JWT_KEY);

        const {_id} = payload;

        if(!_id){
            throw new HttpError(401, "Invalid token");
        }

        const result = await User.findById(_id);

        if(!result){
            throw new HttpError(401, "User Doesn't Exist");
        }

        const IsBlocked = await redisClient.exists(`token:${token}`);

        if(IsBlocked)
            throw new HttpError(401, "Invalid Token");

        req.result = result;

        next();
    }
    catch(err){
        handleError(res, err)
    }

}

module.exports = userMiddleware;
