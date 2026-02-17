import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUserId, USER_ID_HEADER } from '../common/auth/current-user-id.decorator';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import { UserProfileDto } from './dto/user-profile.dto';
import { UsersService } from './users.service';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: `Get current user profile (use ${USER_ID_HEADER} header)` })
  @ApiOkResponse({ type: UserProfileDto })
  getMe(@CurrentUserId() userId: string): UserProfileDto {
    return this.usersService.getMe(userId);
  }

  @Patch('me')
  @ApiOperation({ summary: `Update current user profile (use ${USER_ID_HEADER} header)` })
  @ApiOkResponse({ type: UserProfileDto })
  updateMe(@CurrentUserId() userId: string, @Body() body: UpdateUserProfileDto): UserProfileDto {
    return this.usersService.updateMe(userId, body);
  }
}
