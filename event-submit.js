const SUBMIT_DATA = [];
const FETCH_URL =
  "https://cq.12348.gov.cn/report1/api/v1/cases/caseApply/createCaseApply";

const CONFIG = {
  applyUrl:
    "https://cq.12348.gov.cn/report1/api/v1/cases/caseApply/createCaseApply",
  idCardBaseInfoUrl:
    "https://cq.12348.gov.cn/report1/api/v1/cases/irs/irsIdCardBaseInfo",
};

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

// 获取人员身份证信息
async function getIdCardBaseInfo(idCard) {
  if (!idCard) {
    throw Error("请传入身份证号");
  }
  const respData = await fetch(
    `${CONFIG.idCardBaseInfoUrl}?idCard=${idCard}&timestamp=${Date.now()}`,
    {
      headers: {
        accept: "application/json, text/plain, */*",
        "accept-language":
          "zh,ja-JP;q=0.9,ja;q=0.8,zh-CN;q=0.7,en-US;q=0.6,en;q=0.5",
        authorization: sessionStorage.getItem("ctis-web-1.6.0-token"),
        "sec-ch-ua":
          '"Google Chrome";v="149", "Chromium";v="149", "Not)A;Brand";v="24"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Windows"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
      },
      referrer: "https://cq.12348.gov.cn/report1/",
      body: null,
      method: "GET",
      mode: "cors",
      credentials: "include",
    },
  ).then((resp) => resp.json());
  const result = respData?.data?.[0];
  if(!result){
    console.warn(`idCard:${idCard}: 未能获取到信息`);
    return;
  }
  return result;
}

function getPersonNationCode(nationStr) {
  try {
    const nationDict = JSON.parse(sessionStorage.getItem("DICT_RYMZ"));
    return (
      nationDict?.find((item) => item.itemText.startsWith(nationStr))
        ?.itemValue ?? "01"
    );
  } catch (error) {
    console.error("解析民族字典失败");
    throw Error(error);
  }
}

async function getPayload(data) {
  const applyTime = getDate(new Date());
  const caseInfo = data["基本情况"];
  const applicantName = data["当事人1"];
  const respondentName = data["当事人2"];
  const applicantIdCard = data["当事人1证件号码"];
  const respondentIdCard = data["当事人2证件号码"];
  const applicantPhoneNumber = data["联系方式"];
  const respondentPhoneNumber = data["联系方式2"];
  const [applicantBaseInfo = {}, respondentBaseInfo = {}] = await Promise.all([
    getIdCardBaseInfo(applicantIdCard),
    getIdCardBaseInfo(respondentIdCard),
  ]);
  const applicantIdCardInfo = getIdCardInfo(applicantIdCard);
  const respondentIdCardInfo = getIdCardInfo(respondentIdCard);

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
        partyName: applicantName,
        idType: "100001",
        idCard: applicantIdCard,
        address: applicantBaseInfo?.hkszd ?? " ",
        age: applicantIdCardInfo.age,
        sex: applicantIdCardInfo.gender,
        nation: getPersonNationCode(applicantBaseInfo.mz),
        phone: applicantPhoneNumber,
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
        partyName: respondentName,
        phone: respondentPhoneNumber,
        idType: "100001",
        idCard: respondentIdCard,
        address: respondentBaseInfo?.hkszd ?? " ",
        age: respondentIdCardInfo.age,
        sex: respondentIdCardInfo.gender,
        nation: getPersonNationCode(respondentBaseInfo.mz),
        partyTypeName: "自然人",
        idTypeName: "身份证",
        dsrType: "bsqr",
        idx: "dsr_2",
      },
    ],
  };
}

async function submitData(data) {
  const payload = await getPayload(data);
  const fetchUrl = `${CONFIG.applyUrl}?timestamp=${Date.now()}`;
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
