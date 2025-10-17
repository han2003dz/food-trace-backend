import { Injectable } from '@nestjs/common'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { v4 as uuidv4 } from 'uuid'

@Injectable()
export class UploadService {
  private s3: S3Client

  constructor() {
    this.s3 = new S3Client({
      region: process.env.AWS_REGION_NAME,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    })
  }

  async uploadFileToS3(file: Express.Multer.File) {
    const id = `${uuidv4()}-${file.originalname}`
    const key = `${process.env.AWS_S3_PATH}/${id}`
    await this.s3.send(
      new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        ACL: 'public-read',
      }),
    )
    return {
      url: `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION_NAME}.amazonaws.com/${key}`,
      key,
      id,
    }
  }
}
