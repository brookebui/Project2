function Validation(values){
    let error = {}

    const pass_pattern = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])[a-zA-Z0-9]{8,}$/

    if(values.email === ""){
        error.email = "Email is required"
    } else{
        error.email = ""
    }

    if(values.password === ""){
        error.password = "Password is required"
    } else if(!pass_pattern.test(values.password)){
        error.password = "Password is invalid"
    } else{
        error.password = ""
    }
    return error;
}

export default Validation;