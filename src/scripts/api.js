'use strict';

const APP_NAME_SNAMI = 'Snami';
const BASE_URL_SNAMI = 'https://snami-back.talenttechlab.org/';
// const BASE_URL_SNAMI = 'https://snami-test-back.talenttechlab.org/';
const APP_NAME_POTOK = 'Potok';
const BASE_URL_POTOK = 'https://app.potok.io/';

class Api {
  constructor(appName, baseUrl, headers) {
    this.appName = appName;
    this.baseUrl = baseUrl;
    this.headers = headers;
  }

  setHeaders = (headers = {}) => {
    this.headers = { ...this.headers, ...headers };
  };

  post = (url, data, config = {}) =>
    this._fetch(url, data ? JSON.stringify(data) : undefined, 'POST', config);

  get = (url, data, config = {}) => this._fetch(url, data, 'GET', config);

  _fetch = (url, data, method, config = {}) => {
    return new Promise((resolve, reject) => {
      const body = method === 'POST' ? { body: data } : {};
      let uriSuffix = '';
      if (method === 'GET' && data && Object.keys(data).length) {
        uriSuffix = Object.keys(data)
          .map(key => `${key}=${encodeURIComponent(data[key])}`)
          .join('&');
      }
      fetch(`${this.baseUrl}${url}${uriSuffix ? `/${uriSuffix}` : ''}`, {
        method,
        ...body,
        headers: this.headers,
        cache: 'no-cache',
        ...config,
      })
        .then(async response => {
          const { ok, status } = response;
            console.log(
              `${method}: ${this.baseUrl}${url}${uriSuffix ? `/${uriSuffix}` : ''}\n`,
              ` response:`,
              response,
            );
          if (ok) {
            const data = await response.json();
            console.log(
              `${method}: ${this.baseUrl}${url}${uriSuffix ? `/${uriSuffix}` : ''}\n`,
              body,
              ` resultData:`,
              data,
              ` status:`,
              status,
            );
            resolve({ ok, data, headers: response.headers, status });
          } else {
            let problem;
            try {
              problem = await response.json();
            } catch (error) {
              problem = error;
            }
            console.log(
              `${method}: ${this.baseUrl}${url}${uriSuffix ? `/${uriSuffix}` : ''}\n`,
              body,
              ` problem:`,
              problem,
              ` status:`,
              status,
            );
            const snamiError = problem && problem.error && problem.error.message;
            const potokErrors =
              problem && problem.errors && Object.values(problem.errors).join(', ');
            resolve({
              app: this.appName,
              ok,
              problem: snamiError || potokErrors || 'Что-то пошло не так',
              status,
            });
          }
        })
        .catch(problem => resolve({ ok: false, problem }));
    });
  };
}

const apiSnami = new Api(APP_NAME_SNAMI, BASE_URL_SNAMI, {
  Accept: 'application/json',
});

const apiPotok = new Api(APP_NAME_POTOK, BASE_URL_POTOK, {
  'Content-Type': 'application/json',
});

const snamiSetAuthHeaders = ({ 'X-Token': xToken = '' } = {}) => {
  apiSnami.setHeaders({ 'X-Token': xToken });
};

const potokSetAuthHeaders = ({
  'access-token': accessToken = '',
  client = '',
  uid = '',
  'token-type': tokenType = '',
  expiry = '',
} = {}) => {
  apiPotok.setHeaders({
    'access-token': accessToken,
    client: client,
    uid: uid,
    'token-type': tokenType,
    expiry: expiry,
  });
};

const requestSnamiLogin = (login, password) => {
  return new Promise(resolve => {
    apiSnami.post('customer/login', { login, password }).then(response => {
      const { ok, data, problem } = response;
      if (ok && data && data.data && data.data.token) {
        resolve({ ...response, data: { 'X-Token': data.data.token } });
      } else {
        resolve({
          ...response,
          data: null,
          problem: problem || 'Не удалось получить токен',
        });
      }
    });
  });
};

const requestPotokLogin = (email, password) => {
  return new Promise(resolve => {
    apiPotok.post('auth/sign_in.json', { email, password }).then(response => {
      const { ok, headers, problem } = response;
      if (ok && headers && headers.get('access-token')) {
        const aurhHeaders = {
          'access-token': headers.get('access-token'),
          client: headers.get('client'),
          uid: headers.get('uid'),
          'token-type': headers.get('token-type'),
          expiry: headers.get('expiry'),
        };
        resolve({ ...response, data: aurhHeaders });
      } else {
        resolve({
          ...response,
          data: null,
          problem: problem || 'Не удалось получить токен',
        });
      }
    });
  });
};

const requestSnamiCustomerInfo = () => {
  return new Promise(resolve => {
    apiSnami.get('customer/get').then(response => {
      const { ok, data, problem } = response;
      if (ok && data && data.data) {
        resolve({ ...response, data: data.data, status });
      } else {
        resolve({
          ...response,
          data: null,
          problem:
            problem ||
            'Не удалось получить информацию о пользователе Snami\nВозможно, необходимо выйти из аккаунта и зайти заново.',
        });
      }
    });
  });
};

const requestPotokCustomerInfo = () => {
  return new Promise(resolve => {
    apiPotok.get('config.json').then(response => {
      const { ok, data, problem } = response;
      if (ok && data && data.user) {
        resolve({ ...response, data: data.user });
      } else {
        resolve({
          ...response,
          data: null,
          problem:
            problem ||
            'Не удалось получить информацию о пользователе Potok.\nВозможно, необходимо выйти из аккаунта и зайти заново.',
        });
      }
    });
  });
};

const requestPotokApplicantInfo = ({ jobId, applicantId }) => {
  return new Promise(resolve => {
    apiPotok.get(`jobs/${jobId}/${applicantId}.json`).then(response => {
      const { ok, data, problem } = response;
      if (ok && data && data.applicant) {
        resolve({ ...response, data: data.applicant });
      } else {
        resolve({
          ...response,
          data: null,
          problem: problem || 'Не удалось получить информацию о кандидате.',
        });
      }
    });
  });
};

const requestSnamiCheckCandidateExist = ({ phone = '', potokId = 0 }) => {
  return new Promise(resolve => {
    apiSnami
      .post('customer/staff/create-check', phone ? { phone } : { potok_id: potokId })
      .then(response => {
        const { ok, data, problem } = response;
        if (ok && data && data.data) {
          resolve({ ...response, data: data.data });
        } else {
          resolve({
            ...response,
            data: null,
            problem:
              problem ||
              data?.error?.message ||
              'Не удалось проверить возможность добавления кандидата.',
          });
        }
      });
  });
};

const requestSnamiCreateCandidate = (
  createNew = true,
  {
    applicantId = 0,
    staffId = 0,
    firstName = '',
    lastName = '',
    middleName = '',
    sex = false,
    birthday = '',
    email = '',
    phone = '',
    locationId = 0,
    hrId = 0,
    mentorId = 0,
    position = '',
    salary = 0,
    vacation = '',
    conditions = '',
    startedDate = '',
    startedTime = '',
  },
) => {
  let request = {
    potok_id: applicantId,
    birthday,
    email,
    first_name: firstName,
    last_name: lastName,
    middle_name: middleName,
    hr_id: hrId,
    is_candidate: true,
    location_id: locationId,
    mentor_id: mentorId,
    meta: JSON.stringify({
      salary,
      vacation_days: vacation,
      work_conditions: conditions,
    }),
    phone,
    position,
    sex,
    started: startedDate,
    started_time: startedTime,
  };
  if (!createNew) {
    request.id = staffId;
    request.update_fields = [
      'birthday',
      'email',
      'potok_id',
      'first_name',
      'hr_id',
      'is_candidate',
      'last_name',
      'location_id',
      'mentor_id',
      'meta',
      'middle_name',
      'phone',
      'photo_base64',
      'position',
      'sex',
      'started',
      'started_time',
    ];
  }
  return new Promise(resolve => {
    apiSnami.post(`customer/staff/${createNew ? 'create' : 'update'}`, request).then(response => {
      const { ok, data, problem } = response;
      if (ok) {
        resolve({ ...response });
      } else {
        resolve({
          ...response,
          data: null,
          problem: problem || data?.error?.message || 'Не удалось добавить кандидата.',
        });
      }
    });
  });
};

const requestSnamiLocationList = () => {
  return new Promise(resolve => {
    apiSnami.post('customer/location/list', {}).then(response => {
      const { ok, data, problem } = response;
      if (ok && data && data.data && data.data.length) {
        resolve({ ...response, data: data.data });
      } else {
        resolve({
          ...response,
          data: null,
          problem: problem || 'Не удалось получить список локаций.',
        });
      }
    });
  });
};

const requestSnamiStaffList = ({ locationId = 0, isHR = false, isMentor = false }) => {
  return new Promise(resolve => {
    apiSnami
      .post('customer/staff/list', {
        is_hr: isHR ? 'true' : 'none',
        is_mentor: isMentor ? 'true' : 'none',
        location_id: locationId,
      })
      .then(response => {
        const { ok, data, problem } = response;
        if (ok && data && data.data && data.data.length) {
          resolve({ ...response, data: data.data });
        } else {
          resolve({
            ...response,
            data: null,
            problem: problem || `Не удалось получить список ${isHR ? 'HR' : 'наставников'}.`,
          });
        }
      });
  });
};
