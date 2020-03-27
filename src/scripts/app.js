'use strict';

if (
  chrome &&
  chrome.extension &&
  chrome.extension.getBackgroundPage &&
  chrome.extension.getBackgroundPage() &&
  chrome.extension.getBackgroundPage().console
) {
  console = chrome.extension.getBackgroundPage().console;
}
const storageSync = chrome.storage.sync;
const storageLocal = chrome.storage.local;
// storageSync.clear();
// storageLocal.clear();

const datePickerOptions = {
  // Whether or not to close the datepicker immediately when a date is selected.
  autohide: true,
  // Date to view when initially opening the calendar.
  // Date, String or Object with keys year, month, and day.
  // Defaults to today() by the program
  defaultViewDate: undefined,
  format: 'dd.mm.yyyy',
  language: 'ru',
  maxDate: null,
  maxNumberOfDates: 1,
  maxView: 2,
  minDate: null,
  nextArrow: '»',
  prevArrow: '«',
  // left|right|auto for horizontal and top|bottom|auto for virtical.
  orientation: 'auto',
  showDaysOfWeek: true,
  showOnFocus: true,
  todayHighlight: true,
  weekStart: 1,
};

class App {
  constructor() {
    this.snamiStageServer = false;
    this.snamiHeaders = '';
    this.snamiCustomerName = '';
    this.snamiCustomerEmail = '';
    this.potokHeaders = '';
    this.potokCustomerName = '';
    this.potokCustomerEmail = '';
    this.potokCustomerEmail = '';
    this.applicant = null;
    this.snamiLocationsList = [];
    this.snamiHRList = [];
    this.snamiMentorsList = [];
    this.mainInfo = '';
    this.maskPhone = null;
    this.birthdsayDatepicker = null;
    this.maskSalary = null;
    this.maskVacation = null;
    this.startedDatepicker = null;
    this.maskStartedTime = null;
    this.keysPressed = [];
    this.headerContainer = document.getElementById('header');
    this.appContainer = document.getElementById('app');
    this.submitListener = document.addEventListener('submit', this._onSubmitForm);
    this.clickListener = document.addEventListener('click', this._onClickElement);
    this.changeListener = document.addEventListener('change', this._onChangeElement);
    this.inputChangeListener = document.addEventListener('input', this._onInputElement);
    this.inputBlurListener = document.addEventListener('blur', this._onInputElement);
    this.keyDownListener = document.addEventListener('keydown', this._onKey);
    this.keyUpListener = document.addEventListener('keyup', this._onKey);
    apiSnami.refreshToken = this._refreshSnamiToken;
    this._initApp();
  }

  _refreshSnamiToken = (resolve, reject) => {
    return new Promise(() => {
      requestSnamiTokenExchange().then(({ data, problem }) => {
        if (data) {
          this.snamiHeaders = data;
          snamiSetAuthHeaders(data);
          storageSync.set({ snamiHeaders: data }, () => {
            resolve();
          });
        } else {
          reject(problem);
        }
      });
    });
  }

  _render = () => {
    this._hideLoader();
    this.headerContainer.innerHTML = template_header({
      snamiName: this.snamiCustomerName,
      snamiEmail: this.snamiCustomerEmail,
      snamiStageServer: this.snamiStageServer,
      potokName: this.potokCustomerName,
      potokEmail: this.potokCustomerEmail,
    });
    if (!this.mainInfo) {
      if (!this.potokHeaders) {
        storageLocal.get(['authLogin', 'authPassword'], ({ authLogin = '', authPassword = '' }) => {
          this.appContainer.innerHTML = template_authPotok({
            login: authLogin,
            password: authPassword,
            otherCompanyExist: !!this.snamiHeaders,
          });
        });
      } else if (!this.snamiHeaders) {
        storageLocal.get(['authLogin', 'authPassword'], ({ authLogin = '', authPassword = '' }) => {
          this.appContainer.innerHTML = template_authSnami({
            login: authLogin,
            password: authPassword,
            otherCompanyExist: !!this.potokHeaders,
            snamiStageServer: !!this.snamiStageServer,
          });
        });
      } else if (this.applicant && this.snamiLocationsList) {
        this.appContainer.innerHTML = template_candidateForm({
          ...this.applicant,
          locations: this.snamiLocationsList,
          HRsList: this.snamiHRList,
          mentorsList: this.snamiMentorsList,
        });
        this.maskPhone = IMask(document.getElementById(form_inputPhone), {
          mask: '+{7} 000 000-00-00',
        });
        this.maskSalary = IMask(document.getElementById(form_inputSalary), {
          mask: Number,
          min: 0,
          max: 999999999,
          thousandsSeparator: ' ',
        });
        this.maskVacation = IMask(document.getElementById(form_inputVacation), {
          mask: Number,
          min: 0,
          max: 999,
        });
        this.maskStartedTime = IMask(document.getElementById(form_inputStartedTime), {
          mask: '00:00',
        });
        this.birthdsayDatepicker = new Datepicker(
          document.getElementById(form_inputBirthday),
          datePickerOptions,
        );
        this.birthdsayDatepicker.element.addEventListener('changeDate', this._onChangeElement);
        this.startedDatepicker = new Datepicker(
          document.getElementById(form_inputStartedDate),
          datePickerOptions,
        );
        this.startedDatepicker.element.addEventListener('changeDate', this._onChangeElement);
      } else {
        this.appContainer.innerHTML = template_appInfo('что-то пошло не так');
      }
    } else {
      this.appContainer.innerHTML = template_appInfo(this.mainInfo);
    }
  };

  _initApp = () => {
    storageSync.get(
      ['snamiHeaders', 'potokHeaders', 'snamiStageServer'],
      ({ snamiHeaders = null, potokHeaders = null, snamiStageServer = false }) => {
        this.snamiHeaders = snamiHeaders;
        this.snamiStageServer = snamiStageServer;
        this.potokHeaders = potokHeaders;
        apiSnami.setBaseUrl(this.snamiStageServer ? BASE_URL_SNAMI_STAGE : BASE_URL_SNAMI_PROD);
        if (this.snamiHeaders && this.potokHeaders) {
          snamiSetAuthHeaders(this.snamiHeaders);
          potokSetAuthHeaders(this.potokHeaders);
          this._showLoader();
          this._getCustomersInfo()
            .then(() => {
              this._getApplicantContent()
                .then(() => {
                  this._getLocationsList()
                    .then(() => {
                      if (this.applicant.locationId) {
                        this._render();
                        this._showLoader();
                        this._getStaffList(this.applicant.locationId)
                          .then(() => {
                            this._hideLoader();
                            this._render();
                          })
                          .catch(error => {
                            this._hideLoader();
                            this.mainInfo = error;
                            this._render();
                          });
                      } else {
                        // this._hideLoader();
                        this._render();
                      }
                    })
                    .catch(error => {
                      this.mainInfo = error;
                      this._render();
                    });
                })
                .catch(error => {
                  this.mainInfo = error;
                  this._render();
                });
            })
            .catch(error => {
              this.mainInfo = error;
              this._render();
            });
        } else if (this.snamiHeaders) {
          snamiSetAuthHeaders(this.snamiHeaders);
          this._showLoader();
          this._getSnamiCustomerInfo()
            .then(() => {
              this._render();
            })
            .catch(error => {
              this.mainInfo = error;
              this._render();
            });
        } else if (this.potokHeaders) {
          potokSetAuthHeaders(this.potokHeaders);
          this._showLoader();
          this._getPotokCustomerInfo()
            .then(() => {
              this._render();
            })
            .catch(error => {
              this.mainInfo = error;
              this._render();
            });
        } else {
          this._render();
        }
      },
    );
  };

  _onSubmitForm = event => {
    event.preventDefault();
    const {
      target: { name, elements },
    } = event;
    switch (name) {
      case form_authSnami:
      case form_authPotok:
        {
          let login = '';
          let password = '';
          for (let key in elements) {
            if (elements[key].name === form_authLogin) {
              login = elements[key].value;
            }
            if (elements[key].name === form_authPassword) {
              password = elements[key].value;
            }
          }
          this._showLoader();
          if (name === form_authSnami) {
            requestSnamiLogin(login, password).then(({ data, problem }) => {
              this._hideLoader();
              if (data) {
                storageSync.set({ snamiHeaders: data }, () => {
                  storageLocal.set({ authLogin: '', authPassword: '' }, () => {
                    this._initApp();
                  });
                });
              } else {
                this._showAuthError(problem);
              }
            });
          }
          if (name === form_authPotok) {
            requestPotokLogin(login, password).then(({ data, problem }) => {
              this._hideLoader();
              if (data) {
                storageSync.set({ potokHeaders: data }, () => {
                  storageLocal.set({ authLogin: '', authPassword: '' }, () => {
                    this._initApp();
                  });
                });
              } else {
                this._showAuthError(problem);
              }
            });
          }
        }
        break;
      case form_candidate:
        {
          let errors = 0;
          errors += this._validateFormItem(
            this.applicant.firstName,
            form_inputFirstName,
            'Обязательное поле',
            this._validatorNoEmpty,
          );
          errors += this._validateFormItem(
            this.applicant.lastName,
            form_inputLastName,
            'Обязательное поле',
            this._validatorNoEmpty,
          );
          errors += this._validateFormItem(
            this.applicant.birthday,
            form_inputBirthday,
            'Формат: ДД.MM.ГГГГ или пустое',
            null,
            /^$|^\d{2}.\d{2}.\d{4}$/,
          );
          errors += this._validateFormItem(
            this.applicant.sex,
            form_inputSex,
            'Обязательное поле',
            this._validatorNoNull,
          );
          errors += this._validateFormItem(
            this.applicant.phone,
            form_inputPhone,
            'Обязательное поле, формат: +7 999 999-99-99',
            this._validatorPhone,
          );
          errors += this._validateFormItem(
            this.applicant.email,
            form_inputEmail,
            'Формат some@email.com или пустое',
            null,
            /^$|^\S{1,}@\S{1,}\.\S{1,}$/,
          );
          errors += this._validateFormItem(
            this.applicant.locationId,
            form_selectLocationId,
            'Обязательное поле',
            this._validatorNoEmpty,
          );
          errors += this._validateFormItem(
            this.applicant.hrId,
            form_selectHrId,
            'Обязательное поле',
            this._validatorNoEmpty,
          );
          errors += this._validateFormItem(
            this.applicant.mentorId,
            form_selectMentorId,
            'Обязательное поле',
            this._validatorNoEmpty,
          );
          errors += this._validateFormItem(
            this.applicant.startedDate,
            form_inputStartedDate,
            'Формат ДД.MM.ГГГГ или пустое',
            null,
            /^$|^^\d{2}.\d{2}.\d{4}$/,
          );
          errors += this._validateFormItem(
            this.applicant.startedTime,
            form_inputStartedTime,
            'Формат 00:00 или пустое',
            null,
            /^$|^\d{2}:\d{2}$/,
          );
          this._hideFormItemError(form_submitCandidate);
          if (!errors) {
            const phone = String(this.applicant.phone).match(/\d+/g)[0];
            this._showLoader();
            requestSnamiCreateCandidate(!this.applicant.staffId, {
              ...this.applicant,
              locationId: +this.applicant.locationId,
              hrId: +this.applicant.hrId,
              mentorId: +this.applicant.mentorId,
              salary: +this.applicant.salary,
              phone,
              birthday: this.birthdsayDatepicker.getDate('yyyy-mm-dd') || '',
              startedDate: this.startedDatepicker.getDate('yyyy-mm-dd') || '',
            }).then(({ problem }) => {
              this._hideLoader();
              if (problem) {
                this._showFormItemError(form_submitCandidate, problem);
              } else {
                this.mainInfo = this.applicant.editMode ? 'Данные кандидата обновлены' : 'Кандидат успешно добавлен в Snami';
                this._render();
              }
            });
          }
        }
        break;

      default:
        break;
    }
  };

  _onClickElement = event => {
    const {
      target: {
        id: targetId,
        parentElement: { id: parentId },
      },
    } = event;
    if (targetId === id_logoutSnami || parentId === id_logoutSnami) {
      this._logOutSnami().then(() => {
        storageLocal.set({ authLogin: '', authPassword: '' }, () => {
          this._initApp();
        });
      });
    }
    if (targetId === id_logoutPotok || parentId === id_logoutPotok) {
      this._logOutPotok().then(() => {
        storageLocal.set({ authLogin: '', authPassword: '' }, () => {
          this._initApp();
        });
      });
    }
    if (targetId === id_linkCheckpoints) {
      window.open('https://snami.talenttechlab.org/report/meeting', '_blank');
    }
  };

  _onInputElement = event => {
    const {
      target: { id: targetId, value },
    } = event;
    switch (targetId) {
      case form_inputFirstName:
        this.applicant.firstName = value;
        this._validateFormItem(
          value,
          form_inputFirstName,
          'Обязательное поле',
          this._validatorNoEmpty,
        );
        break;
      case form_inputLastName:
        this.applicant.lastName = value;
        this._validateFormItem(
          value,
          form_inputLastName,
          'Обязательное поле',
          this._validatorNoEmpty,
        );
        break;
      case form_inputMiddleName:
        this.applicant.middleName = value;
        break;
      case form_inputBirthday:
        this.applicant.middleName = value;
        this._validateFormItem(
          value,
          form_inputBirthday,
          'Формат: ДД.MM.ГГГГ или пустое',
          null,
          /^$|^\d{2}.\d{2}.\d{4}$/,
        );
        break;
      case form_inputPhone:
        this.applicant.phone = String(value)
          .match(/\d+/g)
          .join('');
        this._validateFormItem(
          value,
          form_inputPhone,
          'Обязательное поле, формат: +7 999 999-99-99',
          this._validatorPhone,
        );
        break;
      case form_inputEmail:
        this.applicant.email = value;
        this._validateFormItem(
          value,
          form_inputEmail,
          'Формат some@email.com или пустое',
          null,
          /^$|^\S{1,}@\S{1,}\.\S{1,}$/,
        );
        break;
      case form_inputPosition:
        this.applicant.position = value;
        break;
      case form_inputSalary:
        this.applicant.salary = value;
        break;
      case form_inputVacation:
        this.applicant.vacation = value;
        break;
      case form_inputConditions:
        this.applicant.conditions = value;
        break;
      case form_inputStartedTime:
        this.applicant.startedTime = value;
        this._validateFormItem(
          value,
          form_inputStartedTime,
          'Формат 00:00 или пустое',
          null,
          /^$|^\d{2}:\d{2}$/,
        );
        break;
      case form_inputStartedDate:
        this.applicant.startedDate = value;
        this._validateFormItem(
          value,
          form_inputStartedDate,
          'Формат ДД.MM.ГГГГ или пустое',
          null,
          /^$|^^\d{2}.\d{2}.\d{4}$/,
        );
        break;

      default:
        break;
    }
  };

  _onKey = event => {
    const { type, keyCode } = event;
    this.keysPressed[keyCode] = type === 'keydown';

    if (
      this.keysPressed[83] &&
      this.keysPressed[78] &&
      this.keysPressed[65] &&
      !this._isLoading()
    ) {
      if (!this.snamiHeaders && this.potokHeaders) {
        storageSync.set({ snamiStageServer: !this.snamiStageServer }, () => {
          this.snamiStageServer = !this.snamiStageServer;
          apiSnami.setBaseUrl(this.snamiStageServer ? BASE_URL_SNAMI_STAGE : BASE_URL_SNAMI_PROD);
          this._render();
        });
      }
    }
  };

  _validateFormItem = (value, itemId, errorText, validatorFunction, validatorRegExp) => {
    if (validatorFunction ? validatorFunction(value) : new RegExp(validatorRegExp).test(value)) {
      this._hideFormItemError(itemId);
      return 0;
    } else {
      this._showFormItemError(itemId, errorText);
      return 1;
    }
  };

  _validatorNoEmpty = value => {
    if (value) {
      return true;
    } else {
      return false;
    }
  };
  _validatorNoNull = value => {
    if (value !== null) {
      return true;
    } else {
      return false;
    }
  };

  _validatorPhone = value => {
    if (value &&
      String(value)
        .match(/\d+/g)
        .join('').length === 11
    ) {
      return true;
    } else {
      return false;
    }
  };

  _showFormItemError = (itemId, error) => {
    let node = document.getElementById(`${itemId}_error`);
    if (node) {
      node.innerHTML = `<div class="form-error">${error}</div>`;
    }
  };

  _hideFormItemError = itemId => {
    let node = document.getElementById(`${itemId}_error`);
    if (node) {
      node.innerHTML = '';
    }
  };

  _logOutSnami = () => {
    return new Promise(resolve => {
      storageSync.remove('snamiHeaders', () => {
        this.snamiHeaders = '';
        this.snamiCustomerName = '';
        this.snamiCustomerEmail = '';
        resolve();
      });
    });
  };

  _logOutPotok = () => {
    return new Promise(resolve => {
      storageSync.remove('potokHeaders', () => {
        this.potokHeaders = '';
        this.potokCustomerName = '';
        this.potokCustomerEmail = '';
        resolve();
      });
    });
  };

  _onChangeElement = event => {
    const {
      target: { name, value },
      detail,
    } = event;
    switch (name) {
      case form_selectLocationId:
        {
          if (value !== this.applicant.locationId) {
            this.applicant.locationId = value;
            this.applicant.hrId = '';
            this.applicant.mentorId = '';
            this.snamiHRList = [];
            this.snamiMentorsList = [];
            if (value) {
              this._showLoader();
              this._getStaffList(value)
                .then(() => {
                  this._hideLoader();
                  this._render();
                })
                .catch(error => {
                  this.mainInfo = error;
                  this._hideLoader();
                  this._render();
                });
            } else {
              this._render();
            }
          }
        }
        break;
      case form_selectHrId:
        {
          this.applicant.hrId = value;
        }
        break;
      case form_selectMentorId:
        {
          this.applicant.mentorId = value;
        }
        break;
      case form_inputBirthday:
        this.applicant.birthday = Datepicker.formatDate(detail.date, 'dd.mm.yyyy');
        break;
      case form_inputStartedDate:
        this.applicant.startedDate = Datepicker.formatDate(detail.date, 'dd.mm.yyyy');
        break;
      case form_inputSex:
        this.applicant.sex = !!value;
        break;
      case form_authLogin:
        storageLocal.set({ authLogin: value }, () => {});
        break;
      case form_authPassword:
        storageLocal.set({ authPassword: value }, () => {});
        break;

      default:
        break;
    }
  };

  _showLoader = () => {
    document.activeElement && document.activeElement.blur();
    document.getElementById('loader').className = 'loader-active';
  };

  _hideLoader = () => {
    document.getElementById('loader').className = 'loader-inactive';
  };

  _isLoading = () => {
    return document.getElementById('loader').className === 'loader-active';
  };

  _showAuthError = error => {
    document.getElementById('auth-error').innerHTML = `<div class="form-error">${error}</div>`;
  };

  _hideAuthError = () => {
    document.getElementById('auth-error').innerHTML = '';
  };

  _getCustomersInfo = () => {
    return new Promise((resolve, reject) => {
      this._getSnamiCustomerInfo()
        .then(() => {
          this._getPotokCustomerInfo()
            .then(() => {
              resolve();
            })
            .catch(error => reject(error));
        })
        .catch(error => reject(error));
    });
  };

  _getSnamiCustomerInfo = () => {
    return new Promise((resolve, reject) => {
      requestSnamiCustomerInfo().then(({ data, problem, status }) => {
        if (data) {
          this.snamiCustomerName = data.name || '';
          this.snamiCustomerEmail = data.email || '';
          resolve();
        } else {
          if (status >= 401) {
            this._logOutSnami().then(() => {
              resolve();
            });
          } else {
            reject(problem);
          }
        }
      });
    });
  };

  _getPotokCustomerInfo = () => {
    return new Promise((resolve, reject) => {
      requestPotokCustomerInfo().then(({ data, problem }) => {
        if (data) {
          this.potokCustomerName = data.name || '';
          this.potokCustomerEmail = data.email || '';
          resolve();
        } else {
          if (status >= 401) {
            this._logOutPotok().then(() => {
              resolve();
            });
          } else {
            reject(problem);
          }
        }
      });
    });
  };

  _getApplicantContent = () => {
    return new Promise((resolve, reject) => {
      chrome.tabs.getSelected(null, tab => {
        const { url } = tab;
        let jobId = '';
        let applicantId = '';
        // https://app.potok.io/jobs/189190/6167883
        // https://app.potok.io/jobs/189190/stage/1515235/6167883
        // https://app.potok.io/jobs/189190/stage/all/?applicantId=6167883
        if (/app.potok.io\/jobs\/\d+\/\d+/.test(url)) {
          const ids = url.match(/\d+/g);
          jobId = ids[0];
          applicantId = ids[1];
        }
        if (/app.potok.io\/jobs\/\d+\/stage\/\d+\/\d+/.test(url)) {
          const ids = url.match(/\d+/g);
          jobId = ids[0];
          applicantId = ids[2];
        }
        if (/app.potok.io\/jobs\/\d+\S+applicantId=\d+/.test(url)) {
          const jobStr = url.match(/jobs\/\d+/g)[0];
          const applicantStr = url.match(/applicantId=\d+/g)[0];
          if (jobStr) {
            jobId = jobStr.match(/\d+/g)[0];
          }
          if (applicantStr) {
            applicantId = applicantStr.match(/\d+/g)[0];
          }
        }
        if (jobId && applicantId) {
          this._showLoader();
          requestPotokApplicantInfo({ jobId, applicantId }).then(({ data, problem }) => {
            if (data) {
              const {
                first_name: firstName = '',
                last_name: lastName = '',
                middle_name: middleName = '',
                gender = '',
                born: birthday = '',
                email = '',
                phone = '',
              } = data;
              const validPhone = phone ? `7${String(phone).slice(-10)}` : '';
              const formattedBirthday =
                birthday &&
                moment(birthday, 'YYYY-MM-DD').format('DD.MM.YYYY') &&
                moment(birthday, 'YYYY-MM-DD').format('DD.MM.YYYY');
              this.applicant = {
                applicantId: +applicantId,
                firstName,
                lastName,
                middleName,
                sex: gender === 'male' ? true : gender === 'female' ? false : null,
                birthday: formattedBirthday ? formattedBirthday : '',
                email: email ? email : '',
                phone: validPhone,
                locationId: '',
                hrId: '',
                mentorId: '',
                position: '',
                salary: '',
                vacation: '',
                conditions: '',
                startedDate: '',
                startedTime: '',
              };
              this._checkCandidateExist({ potokId: +applicantId })
                .then(staffByPotokId => {
                  if (staffByPotokId && staffByPotokId.editMode) {
                    let {
                      id: staffId,
                      first_name: staffFirstName,
                      last_name: staffLastName,
                      middle_name: staffMiddleName,
                      phone: staffPhone,
                      email: staffEmail,
                      birthday: staffBirthday,
                      sex = false,
                      started: startedDate = '',
                      started_time: startedTime = '',
                      location_id: locationId = 0,
                      hr_id: hrId = 0,
                      mentor_id: mentorId = 0,
                      position = '',
                      meta: {
                        salary = '',
                        vacation_days: vacation = 0,
                        conditions = '',
                      } = {},
                      editMode,
                    } = staffByPotokId;
                    if (staffBirthday) {
                      staffBirthday = moment(staffBirthday, 'YYYY-MM-DD').format('DD.MM.YYYY');
                    }
                    if (startedDate) {
                      startedDate = moment(startedDate, 'YYYY-MM-DD').format(
                        'DD.MM.YYYY',
                      );
                    }
                    this.applicant = {
                      ...this.applicant,
                      staffId,
                      editMode,
                      firstName: staffFirstName,
                      lastName: staffLastName,
                      middleName: staffMiddleName,
                      sex,
                      birthday: staffBirthday,
                      email: staffEmail,
                      phone: staffPhone,
                      locationId,
                      hrId,
                      mentorId,
                      position,
                      salary,
                      vacation,
                      conditions,
                      startedDate,
                      startedTime,
                    };
                  } else {
                    if (staffByPotokId && staffByPotokId.id) {
                      this.applicant = {
                        ...this.applicant,
                        staffId: staffByPotokId.id,
                      };
                    }
                  }
                  this._hideLoader();
                  resolve();
                })
                .catch(problem => {
                  this._hideLoader();
                  reject(problem);
                });
            } else {
              this._hideLoader();
              reject(problem);
            }
          });
        } else {
          reject('Для работы расширения необходимо открыть страницу с кандидатом в Potok.io');
        }
      });
    });
  };

  _checkCandidateExist = ({ phone, potokId }) => {
    return new Promise((resolve, reject) => {
      let requestData = {};
      if (phone) {
        requestData = { phone };
      } else {
        requestData = { potokId };
      }
      requestSnamiCheckCandidateExist(requestData).then(({ data, problem }) => {
        if (data && data.state) {
          const { state, staff, customer } = data;
          if (state === 'NEW' || state === 'FREE' || (state === 'BUSY' && !!customer?.is_own)) {
            if (staff?.id) {
              resolve({...staff, editMode: state === 'BUSY'});
            } else {
              resolve(undefined);
            }
          } else {
            const name = `${staff?.last_name || ''} ${staff?.first_name ||
              ''} ${staff?.middle_name || ''}`;
            reject(
              `Кандидат ${name} уже адаптируется в ${
                customer?.is_own ? 'вашей' : 'другой'
              } компании.`,
            );
          }
        } else {
          reject(problem);
        }
      });
    });
  };

  _getLocationsList = () => {
    return new Promise((resolve, reject) => {
      requestSnamiLocationList().then(({ data, problem }) => {
        if (data) {
          this.snamiLocationsList = data;
          resolve();
        } else {
          reject(problem);
        }
      });
    });
  };

  _getStaffList = locationId => {
    return new Promise((resolve, reject) => {
      requestSnamiStaffList({ locationId, isHR: true }).then(({ data, problem }) => {
        if (data) {
          this.snamiHRList = data;
          requestSnamiStaffList({ locationId, isMentor: true }).then(({ data, problem }) => {
            if (data) {
              this.snamiMentorsList = data;
              resolve();
            } else {
              reject(problem);
            }
          });
        } else {
          reject(problem);
        }
      });
    });
  };
}

var app = new App();
