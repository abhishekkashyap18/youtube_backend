class ApiError extends Error{
    constructor(
        statusCode,
        message= "Something went wrong",
        error = [],
        statck = ""
    ){
        super(message)
        this.statusCode = statusCode
        this.data = null // TODO: read more 
        this.message = message
        this.success = false
        this.errors = error

        if(statck){
            this.stack = statck
        }else{
            Error.captureStackTrace(this, this.constructor)
        }
    }
}

export { ApiError }