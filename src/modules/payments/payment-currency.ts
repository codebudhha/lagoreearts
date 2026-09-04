/**
 * Module 21: Payments — Currency & Minor-Unit Helper
 * Lagoree Arts Backend
 * 
 * Provides deterministic precision conversions between commercial monetary
 * decimal amounts and gateway minor units (e.g. INR -> paise).
 */

export class PaymentCurrencyHelper {
  /**
   * Converts a major decimal currency amount (e.g., 100.50 INR) into integer minor units (10050 paise).
   * Eliminates binary floating-point representation artifacts.
   */
  public static toMinorUnits(amount: number | string, currency: string = 'INR'): number {
    const num = typeof amount === 'string' ? parseFloat(amount) : Number(amount);
    if (isNaN(num) || num < 0) {
      throw new Error(`Invalid monetary amount: ${amount}`);
    }

    const curr = currency.toUpperCase();
    // Zero-decimal currencies (JPY, KRW, etc.)
    if (['JPY', 'KRW', 'VND', 'CLP'].includes(curr)) {
      return Math.round(num);
    }

    // Standard two-decimal currencies (INR, USD, EUR, GBP, etc.)
    return Math.round(num * 100);
  }

  /**
   * Converts minor units (e.g., 10050 paise) into major decimal currency units (100.50 INR).
   */
  public static fromMinorUnits(amountInMinor: number, currency: string = 'INR'): number {
    if (isNaN(amountInMinor) || amountInMinor < 0) {
      throw new Error(`Invalid minor monetary amount: ${amountInMinor}`);
    }

    const curr = currency.toUpperCase();
    if (['JPY', 'KRW', 'VND', 'CLP'].includes(curr)) {
      return Math.round(amountInMinor);
    }

    return Math.round(amountInMinor) / 100;
  }

  /**
   * Formats a monetary amount to 2 decimal places as a standard string.
   */
  public static formatDecimal(amount: number | string): string {
    const num = typeof amount === 'string' ? parseFloat(amount) : Number(amount);
    return isNaN(num) ? '0.00' : num.toFixed(2);
  }
}
