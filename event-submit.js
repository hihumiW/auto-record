const SUBMIT_DATA = [];
const FETCH_URL =
  "https://cq.12348.gov.cn/report1/api/v1/cases/caseApply/createCaseApply";

function getIdCardInfo(idCard) {
  idCard = idCard.trim();

  if (!idCard || (idCard.length !== 15 && idCard.length !== 18)) {
    throw new Error("身份证号码格式不正确，应为15位或18位");
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
    year = parseInt("19" + idCard.substring(6, 8), 10);
    month = parseInt(idCard.substring(8, 10), 10);
    day = parseInt(idCard.substring(10, 12), 10);
    genderCode = parseInt(idCard.charAt(14), 10);
  }

  // 验证日期是否有效
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    throw new Error("身份证号码中的日期无效");
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

  // 判断性别
  const gender = genderCode % 2 === 1 ? "1" : "2";

  return {
    age,
    gender,
  };
}

function getDate(now) {
  const offset = (n) => String(n).padStart(2, "0");

  const YYYY = now.getFullYear();
  const MM = offset(now.getMonth() + 1);
  const DD = offset(now.getDate());
  const HH = offset(now.getHours());
  const mm = offset(now.getMinutes());
  const ss = offset(now.getSeconds());

  const formatted = `${YYYY}-${MM}-${DD} ${HH}:${mm}:${ss}`;
  return formatted;
}

function getPayload(data) {
  const applyTime = getDate(new Date());
  const p1 = data["当事人1"];
  const p2 = data["当事人2"];
  const p1Id = data["当事人1证件号码"];
  const p2Id = data["当事人2证件号码"];
  const p1PhoneNumber = data["联系方式"];
  const p2PhoneNumber = data["联系方式2"];
  const caseInfo = data["基本情况"];
  const { age, gender } = getIdCardInfo(p1Id);
  const p2IdCardInfo = getIdCardInfo(p2Id);

  return {
    applyTime,
    caseInfo,
    applyDetail: "申请调解",
    sourceType: 1,
    applyPartyList: [
      {
        partyType: "1",
        isAgent: 0,
        agentName: null,
        agentPhone: null,
        agentIdType: null,
        agentIdCard: null,
        partyName: p1,
        idType: "100001",
        idCard: p1Id,
        address: " ",
        age: age,
        sex: gender,
        nation: "01",
        phone: p1PhoneNumber,
        partyTypeName: "自然人",
        idTypeName: "身份证",
        dsrType: "sqr",
        idx: "dsr_1",
      },
    ],
    replyPartyList: [
      {
        partyType: "1",
        isAgent: 0,
        agentName: null,
        agentPhone: null,
        agentIdType: null,
        agentIdCard: null,
        partyName: p2,
        phone : p2PhoneNumber,
        idType: "100001",
        idCard: p2Id,
        address: " ",
        age: p2IdCardInfo.age,
        sex: p2IdCardInfo.gender,
        nation: "01",
        partyTypeName: "自然人",
        idTypeName: "身份证",
        dsrType: "bsqr",
        idx: "dsr_2",
      },
    ],
  };
}

async function submitData(data) {
  const payload = getPayload(data);
  const fetchUrl = `${FETCH_URL}?timestamp=${Date.now()}`;
  return fetch(fetchUrl, {
    headers: {
      authorization: sessionStorage.getItem("ctis-web-1.6.0-token"),
      accept: "application/json, text/plain, */*",
      "content-type": "application/json",
      "sec-ch-ua":
        '"Chromium";v="146", "Not-A.Brand";v="24", "Google Chrome";v="146"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"Windows"',
    },
    referrer: "https://cq.12348.gov.cn/report1/",
    body: JSON.stringify(payload),
    method: "POST",
    mode: "cors",
    credentials: "include",
  });
}

async function wait(duration) {
  return new Promise((r) => {
    setTimeout(() => {
      r();
    }, duration);
  });
}

async function runTask() {
  let successCount = 0;
  let failCount = 0;
  for (let i = 0; i < SUBMIT_DATA.length; i++) {
    const data = SUBMIT_DATA[i];
    try {
      await submitData(data).then((resp) => {
        console.log(`✅:${++successCount}`);
      });
    } catch (e) {
      console.warn(
        `❌ ：数据：${i + 1}发起失败（${++failCount}）:`,
        e.message,
        data,
      );
    }

    await wait(2000);
  }
  console.log("--------------执行完成---------------");
  console.log(`成功：${successCount}, 失败${failCount}`);
}
