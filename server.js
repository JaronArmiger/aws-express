require('dotenv').config();
const express = require('express');
const multer = require('multer');
const AWS = require('aws-sdk');
const fs = require('fs');

const app = express();

const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});

const upload = multer({ storage });

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_ACCESS_KEY,
  region: 'us-east-2',
});

const s3 = new AWS.S3();
// POST method route for uploading file
app.post('/post_file', upload.single('demo_file'), (req, res) => {
  // multer middlware adds file or files object to req object
  // req.file is the demo_file
  // also adds body object
  uploadFile(req.file.path, req.file.filename, res);
});

app.get('/get_file/:file_name', (req, res) => {
  retrieveFile(req.params.file_name, res);
});

app.listen(3000, () => {
  console.log('server running on port 3000');
});

const uploadFile = (source, targetName, res) => {
  console.log('preparing to upload...');
  fs.readFile(source, (err, filedata) => {
    if (err) return res.send({ err });
    const putParams = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: targetName,
      Body: filedata,
    };
    s3.putObject(putParams, (err, data) => {
      if (err) {
        console.log('Could not upload file: ', err);
        return res.send({ success: false });
      }
      // deletes file from uploads folder
      fs.unlink(source);
      console.log('successfully uploaded file');
      return res.send({ success: true })
    })
  })
};

const retrieveFile = (filename, res) => {
  const getParams = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: filename,
  };

  s3.getObject(getParams, (err, data) => {
  	if (err) return res.status(400).send({ success: false, err });
  	return res.send(data.Body);
  });
}