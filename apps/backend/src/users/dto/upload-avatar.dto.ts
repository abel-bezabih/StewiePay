import { IsString, IsNotEmpty } from 'class-validator';

export class UploadAvatarDto {
  @IsString()
  @IsNotEmpty()
  image!: string; // Base64 encoded image string
}






