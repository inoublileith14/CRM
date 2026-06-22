export class ChatMessageDto {
  role!: 'user' | 'assistant';
  content!: string;
}

export class ChatRequestDto {
  message!: string;
  history?: ChatMessageDto[];
}
