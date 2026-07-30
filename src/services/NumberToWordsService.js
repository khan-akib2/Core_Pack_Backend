class NumberToWordsService {
  static convert(amount) {
    if (isNaN(amount) || amount === 0) return 'Zero Rupees Only';

    const single = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
      'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const double = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const convertTwoDigits = (n) => {
      if (n < 20) return single[n];
      return double[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + single[n % 10] : '');
    };

    const convertThreeDigits = (n) => {
      const hundred = Math.floor(n / 100);
      const remainder = n % 100;
      let str = '';
      if (hundred > 0) str += single[hundred] + ' Hundred';
      if (remainder > 0) str += (str ? ' ' : '') + convertTwoDigits(remainder);
      return str;
    };

    let num = Math.floor(amount);
    const paise = Math.round((amount - num) * 100);

    let res = '';

    const crore = Math.floor(num / 10000000);
    num %= 10000000;
    if (crore > 0) res += convertThreeDigits(crore) + ' Crore ';

    const lakh = Math.floor(num / 100000);
    num %= 100000;
    if (lakh > 0) res += convertTwoDigits(lakh) + ' Lakh ';

    const thousand = Math.floor(num / 1000);
    num %= 1000;
    if (thousand > 0) res += convertTwoDigits(thousand) + ' Thousand ';

    if (num > 0) res += convertThreeDigits(num);

    res = res.trim() + ' Rupees';

    if (paise > 0) {
      res += ' and ' + convertTwoDigits(paise) + ' Paise';
    }

    return res + ' Only';
  }
}

export default NumberToWordsService;
