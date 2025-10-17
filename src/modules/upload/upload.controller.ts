import { Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { UploadService } from './upload.service'
import { ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger'

@ApiBearerAuth()
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('image')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    return this.uploadService.uploadFileToS3(file)
  }

  @Post('file')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    return this.uploadService.uploadFileToS3(file)
  }
}
