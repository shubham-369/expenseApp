const AWS =  require('aws-sdk');

function uploadToS3(data, filename){

    const bucketName = process.env.BUCKET_NAME;
    const iam_user_key = process.env.ACCESS_KEY;
    const iam_user_secret_key = process.env.SECRET_KEY;

    let s3bucket = new AWS.S3({        
        accessKeyId: iam_user_key,
        secretAccessKey: iam_user_secret_key
    });

    let params = {
        Bucket: bucketName,
        Key: filename,
        Body: data,
        ACL: 'public-read'
    };
    
    return new Promise((resolve, reject) => {   
        s3bucket.upload(params, (err, response) => { 
            if(err){
                console.log(err);
                reject('error while uploading expenses to AWS!: ',err);
            }else{
                resolve(response.Location);
            }
        });
    });
};

module.exports = {uploadToS3};