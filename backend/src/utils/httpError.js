class HttpError extends Error {
    constructor(status, message){
        super(message);
        this.status = status;
    }
}

const errorResponse = (res, status, message)=> res.status(status).json({ message });

const handleError = (res, err)=>{

    if(err instanceof HttpError)
        return errorResponse(res, err.status, err.message);

    if(err.name==='JsonWebTokenError' || err.name==='TokenExpiredError')
        return errorResponse(res, 401, "Invalid or expired token");

    if(err.name==='CastError')
        return errorResponse(res, 400, "Invalid id");

    if(err.name==='ValidationError')
        return errorResponse(res, 400, err.message);

    if(err.code===11000){
        const field = Object.keys(err.keyValue || {})[0];
        return errorResponse(res, 409, field==='emailId' ? "Email already registered" : "Duplicate value");
    }

    if(err.type==='entity.parse.failed')
        return errorResponse(res, 400, "Malformed JSON body");

    console.error(err);
    return errorResponse(res, 500, "Internal server error");
}

module.exports = {HttpError, errorResponse, handleError};
