const validator =require("validator");
const {HttpError} = require("./httpError");

const validate = (data)=>{
   
    const mandatoryField = ['firstName',"emailId",'password'];

    const IsAllowed = mandatoryField.every((k)=> Object.keys(data).includes(k));

    if(!IsAllowed)
        throw new HttpError(400, "Some Field Missing");

    if(!validator.isEmail(data.emailId))
        throw new HttpError(400, "Invalid Email");

    if(!validator.isStrongPassword(data.password))
        throw new HttpError(400, "Weak Password");
}

module.exports = validate;