import {
  Controller,
  Get,
  Post,
  Body,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PostsService } from './posts.service';
import 'multer'; // Tells TypeScript to load the Multer types

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  create(
    // ✨ Replaced 'any' with a strict Type!
    @Body() body: { content?: string; authorId: string },
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.postsService.createPost(
      {
        content: body.content,
        authorId: body.authorId,
      },
      file,
    );
  }

  @Get()
  findAll() {
    return this.postsService.findAll();
  }
}
