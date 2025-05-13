export function generateReferralCode(): string {
    const characters: string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let referralCode: string = '';
  
    for (let i = 0; i < 6; i++) { // Generate a 6-character referral code
      const randomIndex: number = Math.floor(Math.random() * characters.length);
      referralCode += characters[randomIndex];
    }
  
    return referralCode;
  }
  