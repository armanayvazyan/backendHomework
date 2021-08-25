const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const bcrypt = require('bcrypt');
const {v4: uuid} = require('uuid');
const jwt = require('jsonwebtoken');

const { getData, saveData } = require('./utils')

const saltRounds = 10;
const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(__dirname));
app.use(multer({dest: "uploads"}).single("filedata"));

app.listen(8080, () => {
    console.log("Server started");
});


function setToken(token, index) {
    let data = getData();
    data['users'][index]['token'] = token;
    saveData(data);
}

app.post('/users/register', (req, res) => {
    let data = getData();
    let id = uuid();

    if (req.body.password > 6) {
        bcrypt.genSalt(saltRounds, (err, salt) => {
            bcrypt.hash(req.body.password, salt, (err, hash) => {
                if (!err) {
                    let token = jwt.sign({
                        userId: id
                    }, 'secret', {expiresIn: '1h'});

                    let obj = {
                        "id": id,
                        "username": req.body.username,
                        "email": req.body.email,
                        "password": hash,
                        "token": token
                    }
                    data["users"].push(obj);
                    saveData(data);

                    let response = {
                        status: "success",
                        message: "User Registered successfully",
                        user: obj
                    }

                    return res.send(response)
                } else {
                    return res.sendStatus(401);
                }
            });
        });
    }
})

app.post("/users/login", (req, res) => {
    let data = getData();

    let email = data['users'].map((element) => element.email);

    let user = data['users'].find(e => {
        if (e.email === req.body.email) {
            return e;
        }
    });

    let index = data['users'].indexOf(user);

    if (email.includes(req.body.email)) {
        bcrypt.compare(req.body.password, user.password, (err, result) => {
            if (result) {
                let token = jwt.sign({
                    userId: user['id']
                }, 'secret', {expiresIn: '1h'});
                setToken(token, index);

                let response = {
                    status: "success",
                    user: {
                       id: user.id,
                       username: user.username,
                       email: user.email,
                       token: token
                    }
                }
                return res.send(response);
            } else {
                return res.send("Invalid password")
            }
        })
    } else {
        return res.send("Invalid Request")
    }
})

app.post("/users/upload", (req, res) => {

    let userId = null;
    jwt.verify(req.header('token'), 'secret', function (err, payload) {
        if (err) {
            return res.send('Invalid Token');
        }
        if (!payload || !payload.userId) {
            return res.send('Invalid Token');
        }
        userId = payload.userId;
    });

    let fileData = req.file;

    if (!fileData) {
        return res.send("Invalid Request, no filedata found");
    }

    if (fileData['mimetype'] === 'image/jpg' ||
        fileData['mimetype'] === 'image/jpeg' ||
        fileData['mimetype'] === 'image/png' ||
        fileData['mimetype'] === 'image/gif') {

        let data = getData();
        let user = data['users'].find(user => {
            if (user.id === userId) {
                return user;
            }
        });

        if (!user) {
            return res.send("Unknown User")
        }

        let obj = {
            id: uuid(),
            path: fileData.path,
            authorId: userId
        };

        data["photos"].push(obj);
        saveData(data);
        return res.send("Uploaded");

    } else {
        return res.send("Invalid format type");
    }
})
