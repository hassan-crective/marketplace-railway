export interface Attachment {
  filename: string;
  content: string | Buffer;
  contentType?: string;
  cid?: string;
}

export interface EmailOptions {
  admins?: Admin[];
  toEmail?: string;
  toName?: string;
  subject: string;
  htmlContent?: string;
  text?: string;
  attachments?: Attachment[];
  from?: string;
}

export interface Admin {
  email: string;
}