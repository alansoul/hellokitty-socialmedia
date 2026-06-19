import {
  Controller,
  Get,
  Post,
  Body,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  Req // ✨ Added Req import
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CacheInterceptor, CacheKey, CacheTTL } from '@nestjs/cache-manager';
import { PostsService } from './posts.service';
import 'multer'; // Tells TypeScript to load the Multer types
import { JwtAuthGuard } from '@hellokitty/shared-security'; 
import { Request } from 'express'; // ✨ Import Request from Express

// ✨ 1. We teach TypeScript exactly what data our JWT token holds!
interface AuthenticatedRequest extends Request {
  user: {
    sub: string;
    email: string;
    tenantId: string;
  };
}

@Controller('posts')
@UseGuards(JwtAuthGuard) // ✨ THIS PROTECTS EVERY ENDPOINT IN THIS FILE!
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  create(
    @Body() body: { content?: string},
   // ✨ 2. Replaced 'any' with our strict custom type!
    @Req() req: AuthenticatedRequest, 
    @UploadedFile() file?: Express.Multer.File,
  ) {
     // ✨ Extract the secure authorId from the decoded token payload
    const secureAuthorId = req.user.sub;

    return this.postsService.createPost(
      {
        content: body.content,
        authorId: secureAuthorId, // 🔒 100% verified identity
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
