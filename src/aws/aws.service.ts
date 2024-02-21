import { Injectable, Logger } from '@nestjs/common';
import * as AWS from 'aws-sdk';
@Injectable()
export class AwsService {
  private logger = new Logger(AwsService.name);

  constructor() {}

  public async uploadArquivo(file: any, id: string) {
    // TODO @deprecated - accessKeyId secretAccessKey
    const s3 = new AWS.S3({
      region: process.env.AWS_REGION,
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    });

    const fileExtension = file.originalname.split('.')[1];
    const urlKey = `${id}.${fileExtension}`;

    const params = {
      Body: file.buffer,
      Bucket: process.env.AWS_S2_BUCKET_NAME,
      Key: urlKey,
    };

    const data = s3
      .putObject(params)
      .promise()
      .then(
        () => {
          return {
            url: `https://${process.env.AWS_S2_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${urlKey}`,
          };
        },
        (err) => {
          this.logger.error(err);
          return err;
        },
      );

    return data;
  }
}
