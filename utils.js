const fs = require('fs');

const dataPath = "./fakedb.json"

const getData = () => {
    let data = fs.readFileSync(dataPath);
    return JSON.parse(data);
}

const saveData = (data) => {
    let stringifyData = JSON.stringify(data);
    fs.writeFileSync(dataPath, stringifyData)
}

module.exports = {
    getData,
    saveData
}
