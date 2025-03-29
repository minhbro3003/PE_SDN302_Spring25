const { json, urlencoded } = require('body-parser');
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const connectionDB = require('./config/db');

const app = express();
app.use(json())
app.use(morgan('dev'));
app.use(cors())
app.use(urlencoded({ extended: true }))

app.get('/', (req, res) => {
    res.status(200).json({
        message: "Welcome to Back-End RestFul API app"
    })
});

//
app.use('/api/products', require('./routes/productRoute'))
app.use('/api/customer', require('./routes/customerRoute'))
//middleware doc loi tu cac actions cua controller
app.use((req, res, err, next) => {
    if (err) {
        res.status(err.StatusCode || 500).json(err);
    }

})


const PORT = process.env.PORT || 9999;
app.listen(PORT, () => {
    console.log(`Server listening on ${PORT}`);
    connectionDB();
});

