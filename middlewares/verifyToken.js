const jwt = require('jsonwebtoken');
const secretKey = 'kjdfsjoerjjfk#jkdfjdl@sjflj$werdgs';

const tokenVerification = (req,res,next)=>{
    const token = req.headers.authorization.split(' ')[1];
    //console.log(token);
    if(!token){
        res.status(403).send('You are not authorized to check this page');
    }
    else{
        // try{
        //     const decodedToken = jwt.verify(token, secretKey);
        //     req.decodedToken = decodedToken;
        // }
        // catch{
        //     res.json({status: "error", data: "Invalid Token"})
        // }

        jwt.verify(token, secretKey, (err, decodedToken)=>{
            if(!err){
                req.decodedToken = decodedToken;
            }
            else{
                res.status(403).send(err, 'Invalid Token');
            }
        })
    }
    return next(); 
}

module.exports = tokenVerification;