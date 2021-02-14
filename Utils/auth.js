module.exports = (req, res, next) => {
    if(req.session && req.session.user) {
        next();
    } else {
        return res.status(400).send({ success: false, message: "Session has been expired" });
    }
    
}