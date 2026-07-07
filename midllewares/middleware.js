module.exports = (req, res, next) => {

    if (!req.session.userId) {

        if (req.method === "GET") {

            req.session.redirectUrl = req.originalUrl;

        }

        return res.redirect("/login");
    }

    next();

};