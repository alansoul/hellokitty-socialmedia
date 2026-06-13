import { Controller, Get, Post, Body, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CacheInterceptor, CacheKey, CacheTTL } from '@nestjs/cache-manager';
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
  @UseInterceptors(CacheInterceptor)
  @CacheKey('global_feed')
  @CacheTTL(10000) // 10 seconds
  findAll() {
    return this.postsService.findAll();
  }
}
