/**
 * 通过中国大陆居民身份证号码获取年龄和性别
 * @param {string} idCard - 身份证号码（支持15位或18位）
 * @returns {Object} 返回包含年龄和性别的对象，格式：{ age: number, gender: string, birthDate: string }
 * @throws {Error} 如果身份证号码格式不正确
 */
function getIdCardInfo(idCard) {
  // 去除空格
  idCard = idCard.trim();
  
  // 验证身份证号码格式
  if (!idCard || (idCard.length !== 15 && idCard.length !== 18)) {
    throw new Error('身份证号码格式不正确，应为15位或18位');
  }
  
  let year, month, day, genderCode;
  
  if (idCard.length === 18) {
    // 18位身份证
    year = parseInt(idCard.substring(6, 10), 10);
    month = parseInt(idCard.substring(10, 12), 10);
    day = parseInt(idCard.substring(12, 14), 10);
    genderCode = parseInt(idCard.charAt(16), 10);
  } else {
    // 15位身份证
    year = parseInt('19' + idCard.substring(6, 8), 10);
    month = parseInt(idCard.substring(8, 10), 10);
    day = parseInt(idCard.substring(10, 12), 10);
    genderCode = parseInt(idCard.charAt(14), 10);
  }
  
  // 验证日期是否有效
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    throw new Error('身份证号码中的日期无效');
  }
  
  // 计算年龄
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  const currentDay = today.getDate();
  
  let age = currentYear - year;
  
  // 如果今年的生日还没过，年龄减1
  if (currentMonth < month || (currentMonth === month && currentDay < day)) {
    age--;
  }
  
  // 判断性别（奇数为男，偶数为女）
  const gender = genderCode % 2 === 1 ? '男' : '女';
  
  // 格式化出生日期
  const birthDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  
  return {
    age,
    gender,
    birthDate,
    year,
    month,
    day
  };
}

// 使用示例
// const info = getIdCardInfo('110101199001011234');
// console.log(info); // { age: 34, gender: '男', birthDate: '1990-01-01', year: 1990, month: 1, day: 1 }

// 导出函数（如果在Node.js环境）
if (typeof module !== 'undefined' && module.exports) {
  module.exports = getIdCardInfo;
}
