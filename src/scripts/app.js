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
    this.snamiServerType = 0;
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
    this.snamiTutorsList = [];
    this.mentorAutocomplete = null;
    this.hrAutocomplete = null;
    this.tutorAutocomplete = null;
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
    // Событие blur можно перехватить только на этапе погружения события
    this.inputBlurListener = document.addEventListener('blur', this._onInputElement, true);
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
          reject?.(problem);
        }
      });
    });
  };

  _render = () => {
    this._hideLoader();
    this.headerContainer.innerHTML = template_header({
      snamiName: this.snamiCustomerName,
      snamiEmail: this.snamiCustomerEmail,
      snamiServerType: this.snamiServerType,
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
        storageLocal.get(
          ['authLogin', 'authPassword', 'snamiTwoFactorAuth'],
          ({ authLogin = '', authPassword = '', snamiTwoFactorAuth = false }) => {
            this.appContainer.innerHTML = template_authSnami({
              login: authLogin,
              password: authPassword,
              otherCompanyExist: !!this.potokHeaders,
              snamiServerType: this.snamiServerType,
              snamiTwoFactorAuth: snamiTwoFactorAuth,
            });
          }
        );
      } else if (this.applicant && this.snamiLocationsList) {
        this.appContainer.innerHTML = template_candidateForm({
          ...this.applicant,
          locations: this.snamiLocationsList,
          HRsList: this.snamiHRList,
          mentorsList: this.snamiMentorsList,
          tutorsList: this.snamiTutorsList,
        });
        const tutorElement = document.getElementById(form_selectTutorId);
        const mentorElement = document.getElementById(form_selectMentorId);
        const hrElement = document.getElementById(form_selectHrId);

        if (this.applicant.locationId) {
          tutorElement.removeAttribute('disabled');
          tutorElement.setAttribute('placeholder', 'Выберите наставника');
          mentorElement.removeAttribute('disabled');
          mentorElement.setAttribute('placeholder', 'Выберите руководителя');
          hrElement.removeAttribute('disabled');
          hrElement.setAttribute('placeholder', 'Выберите HR');
          if (this.applicant.hrId) {
            const hr = this.snamiHRList.find(item => item.id === this.applicant.hrId);
            if (hr) {
              hrElement.value = `${hr.last_name} ${hr.first_name} ${hr.middle_name}`;
            }
          }
          if (this.applicant.mentorId) {
            const mentor = this.snamiMentorsList.find(item => item.id === this.applicant.mentorId);
            if (mentor) {
              mentorElement.value = `${mentor.last_name} ${mentor.first_name} ${mentor.middle_name}`;
            }
          }
          if (this.applicant.tutorId) {
            const tutor = this.snamiTutorsList.find(item => item.id === this.applicant.tutorId);
            if (tutor) {
              tutorElement.value = `${tutor.last_name} ${tutor.first_name} ${tutor.middle_name}`;
            }
          }
        } else {
          tutorElement.setAttribute('disabled', 'disabled');
          tutorElement.setAttribute('placeholder', 'Сначала выберите локацию');
          mentorElement.setAttribute('disabled', 'disabled');
          mentorElement.setAttribute('placeholder', 'Сначала выберите локацию');
          hrElement.setAttribute('disabled', 'disabled');
          hrElement.setAttribute('placeholder', 'Сначала выберите локацию');
        }
        if (this.snamiMentorsList.length) {
          const applicant = this.applicant;
          this.mentorAutocomplete = new Awesomplete(mentorElement, {
            minChars: 1,
            list: this.snamiMentorsList.map(item => ({
              value: item.id,
              label: `${item.last_name} ${item.first_name} ${item.middle_name}`,
            })),
            // insert label instead of value into the input.
            replace: function(suggestion) {
              applicant.mentorId = suggestion.value;
              this.input.value = suggestion.label;
            },
          });
        }
        if (this.snamiHRList.length) {
          const applicant = this.applicant;
          this.hrAutocomplete = new Awesomplete(hrElement, {
            minChars: 1,
            list: this.snamiHRList.map(item => ({
              value: item.id,
              label: `${item.last_name} ${item.first_name} ${item.middle_name}`,
            })),
            // insert label instead of value into the input.
            replace: function(suggestion) {
              applicant.hrId = suggestion.value;
              this.input.value = suggestion.label;
            },
          });
        }
        if (this.snamiTutorsList.length) {
          const applicant = this.applicant;
          this.tutorAutocomplete = new Awesomplete(tutorElement, {
            minChars: 1,
            list: this.snamiTutorsList.map(item => ({
              value: item.id,
              label: `${item.last_name} ${item.first_name} ${item.middle_name}`,
            })),
            // insert label instead of value into the input.
            replace: function(suggestion) {
              applicant.tutorId = suggestion.value;
              this.input.value = suggestion.label;
            },
          });
        }

        this.maskPhone = IMask(document.getElementById(form_inputPhone), {
          mask: '+{7} 000 000-00-00',
        });
        this.maskSalary = IMask(document.getElementById(form_inputSalary), {
          mask: Number,
          min: 0,
          max: 999999999,
          thousandsSeparator: ' ',
        });
        const timeFormat = 'HH:mm';
        this.maskStartedTime = IMask(document.getElementById(form_inputStartedTime), {
          mask: Date,
          pattern: timeFormat,
          format: function(date) {
            return moment(date).format(timeFormat);
          },
          parse: function(str) {
            return moment(str, timeFormat);
          },
          blocks: {
            HH: {
              mask: IMask.MaskedRange,
              from: 0,
              to: 23,
            },
            mm: {
              mask: IMask.MaskedRange,
              from: 0,
              to: 59,
            },
          },
        });
        this.birthdsayDatepicker = new Datepicker(
          document.getElementById(form_inputBirthday),
          datePickerOptions
        );
        this.birthdsayDatepicker.element.addEventListener('changeDate', this._onChangeElement);
        this.startedDatepicker = new Datepicker(
          document.getElementById(form_inputStartedDate),
          datePickerOptions
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
    storageSync.get(['snamiHeaders', 'potokHeaders', 'snamiServerType'],
      (response = {}) => {
        const {snamiHeaders = null, potokHeaders = null, snamiServerType = 0} = response;
        this.snamiHeaders = snamiHeaders;
        this.snamiServerType = snamiServerType;
        this.potokHeaders = potokHeaders;
        apiSnami.setBaseUrl(
          this.snamiServerType
            ? this.snamiServerType === 1
              ? BASE_URL_SNAMI_STAGE
              : BASE_URL_SNAMI_RC
            : BASE_URL_SNAMI_PROD
        );
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
      }
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
              if (data?.headers) {
                storageSync.set({ snamiHeaders: data.headers }, () => {
                  storageLocal.set(
                    { authLogin: '', authPassword: '', snamiTwoFactorAuth: false },
                    () => {
                      this._initApp();
                    }
                  );
                });
              } else if (data?.twoFactor) {
                storageLocal.set({ snamiTwoFactorAuth: true }, () => {
                  this._initApp();
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
            this._validatorNoEmpty
          );
          errors += this._validateFormItem(
            this.applicant.lastName,
            form_inputLastName,
            'Обязательное поле',
            this._validatorNoEmpty
          );
          errors += this._validateFormItem(
            this.applicant.birthday,
            form_inputBirthday,
            'Формат: ДД.MM.ГГГГ или пустое',
            null,
            /^$|^\d{2}.\d{2}.\d{4}$/
          );
          errors += this._validateFormItem(
            this.applicant.sex,
            form_inputSex,
            'Обязательное поле',
            this._validatorNoNull
          );
          errors += this._validateFormItem(
            this.applicant.phone,
            form_inputPhone,
            'Обязательное поле, формат: +7 999 999-99-99',
            this._validatorPhone
          );
          errors += this._validateFormItem(
            this.applicant.email,
            form_inputEmail,
            'Формат some@email.com или пустое',
            null,
            /^$|^\S{1,}@\S{1,}\.\S{1,}$/
          );
          errors += this._validateFormItem(
            this.applicant.locationId,
            form_selectLocationId,
            'Обязательное поле',
            this._validatorNoEmpty
          );
          errors += this._validateFormItem(
            this.applicant.hrId,
            form_selectHrId,
            'Обязательное поле',
            this._validatorNoEmpty
          );
          errors += this._validateFormItem(
            this.applicant.mentorId,
            form_selectMentorId,
            'Обязательное поле',
            this._validatorNoEmpty
          );
          errors += this._validateFormItem(
            this.applicant.startedDate,
            form_inputStartedDate,
            'Формат ДД.MM.ГГГГ или пустое',
            null,
            /^$|^^\d{2}.\d{2}.\d{4}$/
          );
          errors += this._validateFormItem(
            this.applicant.startedTime,
            form_inputStartedTime,
            'Формат 00:00 или пустое',
            null,
            /^$|^\d{2}:\d{2}$/
          );
          this._hideFormItemError(form_submitCandidate);
          if (!errors) {
            const phone = String(this.applicant.phone).match(/\d+/g)[0];
            this._showLoader();
            this._checkCandidateExist({ phone })
              .then(staffByPhone => {
                if (staffByPhone && staffByPhone.id && staffByPhone.id !== this.applicant.staffId) {
                  this._hideLoader();
                  this._showFormItemError(
                    form_submitCandidate,
                    'Телефонный номер уже используется. Возможно, кандидат уже был добавлен вне расширения.'
                  );
                } else {
                  if (!this.applicant.staffId) {
                    requestSnamiCreateCandidate(!this.applicant.staffId, {
                      ...this.applicant,
                      locationId: +this.applicant.locationId,
                      hrId: +this.applicant.hrId,
                      mentorId: +this.applicant.mentorId,
                      tutorId: +this.applicant.tutorId,
                      salary: +this.applicant.salary,
                      phone,
                      birthday: this.birthdsayDatepicker.getDate('yyyy-mm-dd') || '',
                      startedDate: this.startedDatepicker.getDate('yyyy-mm-dd') || '',
                    }).then(({ problem }) => {
                      this._hideLoader();
                      if (problem) {
                        this._showFormItemError(form_submitCandidate, problem);
                      } else {
                        this.mainInfo = this.applicant.editMode
                          ? 'Данные кандидата обновлены'
                          : 'Кандидат успешно добавлен в Snami';
                        this._render();
                      }
                    });
                  } else {
                    requestSnamiCreateCandidate(!this.applicant.staffId, {
                      ...this.applicant,
                      locationId: +this.applicant.locationId,
                      hrId: +this.applicant.hrId,
                      mentorId: +this.applicant.mentorId,
                      tutorId: +this.applicant.tutorId,
                      salary: +this.applicant.salary,
                      phone,
                      birthday: this.birthdsayDatepicker.getDate('yyyy-mm-dd') || '',
                      startedDate: this.startedDatepicker.getDate('yyyy-mm-dd') || '',
                    }).then(({ problem }) => {
                      this._hideLoader();
                      if (problem) {
                        this._showFormItemError(form_submitCandidate, problem);
                      } else {
                        this.mainInfo = this.applicant.editMode
                          ? 'Данные кандидата обновлены'
                          : 'Кандидат успешно добавлен в Snami';
                        this._render();
                      }
                    });
                  }
                }
              })
              .catch(problem => {
                this._hideLoader();
                this._showFormItemError(form_submitCandidate, problem);
              });
          }
        }
        break;

      default:
        break;
    }
  };

  _onClickElement = event => {
    // const { target: { id: targetId, parentElement: { id: parentId } = {} } = {} } = event;
    const { target = {} } = event;
    const targetId = target.id;
    const { parentElement = {} } = target;
    const parentId = parentElement.id;
    if (targetId === id_logoutSnami || parentId === id_logoutSnami) {
      this._logOutSnami().then(() => {
        storageLocal.set({ authLogin: '', authPassword: '' }, () => {
          storageLocal.set({ authLogin: '', authPassword: '', snamiTwoFactorAuth: false }, () => {
            this._initApp();
          });
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
      window.open(
        `${
          FRONT_URL_SNAMI[
            this.snamiServerType
              ? this.snamiServerType === 1
                ? BASE_URL_SNAMI_STAGE
                : BASE_URL_SNAMI_RC
              : BASE_URL_SNAMI_PROD
          ]
        }report/meeting${
          this.applicant.locationId ? `?locationId=${this.applicant.locationId}` : ''
        }`,
        '_blank'
      );
    }
  };

  _onInputElement = event => {
    const { target, type } = event;
    const { id: targetId, value } = target;
    switch (targetId) {
      case form_inputFirstName:
        this.applicant.firstName = value;
        this._validateFormItem(
          value,
          form_inputFirstName,
          'Обязательное поле',
          this._validatorNoEmpty
        );
        break;
      case form_inputLastName:
        this.applicant.lastName = value;
        this._validateFormItem(
          value,
          form_inputLastName,
          'Обязательное поле',
          this._validatorNoEmpty
        );
        break;
      case form_inputMiddleName:
        this.applicant.middleName = value;
        break;
      case form_inputBirthday:
        this.applicant.birthday = value;
        this._validateFormItem(
          value,
          form_inputBirthday,
          'Формат: ДД.MM.ГГГГ или пустое',
          null,
          /^$|^\d{2}.\d{2}.\d{4}$/
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
          this._validatorPhone
        );
        break;
      case form_inputEmail:
        this.applicant.email = value;
        this._validateFormItem(
          value,
          form_inputEmail,
          'Формат some@email.com или пустое',
          null,
          /^$|^\S{1,}@\S{1,}\.\S{1,}$/
        );
        break;
      case form_selectHrId:
        if (type === 'blur') {
          if (!this.applicant.hrId) {
            target.value = '';
          }
          this._validateFormItem(
            this.applicant.hrId,
            form_selectHrId,
            'Обязательное поле',
            this._validatorNoEmpty
          );
        } else {
          this.applicant.hrId = '';
          this._hideFormItemError(form_selectHrId);
        }
        break;
      case form_selectMentorId:
        if (type === 'blur') {
          if (!this.applicant.mentorId) {
            target.value = '';
          }
          this._validateFormItem(
            this.applicant.mentorId,
            form_selectMentorId,
            'Обязательное поле',
            this._validatorNoEmpty
          );
        } else {
          this.applicant.mentorId = '';
          this._hideFormItemError(form_selectMentorId);
        }
        break;
      case form_selectTutorId:
        if (type === 'blur') {
          if (!this.applicant.tutorId) {
            target.value = '';
          }
        } else {
          this.applicant.tutorId = '';
        }
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
          /^$|^\d{2}:\d{2}$/
        );
        break;
      case form_inputStartedDate:
        this.applicant.startedDate = value;
        this._validateFormItem(
          value,
          form_inputStartedDate,
          'Формат ДД.MM.ГГГГ или пустое',
          null,
          /^$|^^\d{2}.\d{2}.\d{4}$/
        );
        break;

      default:
        break;
    }
  };

  _onKey = event => {
    const { type, keyCode, target } = event;
    this.keysPressed[keyCode] = type === 'keydown';

    if (keyCode === 13) {
      if (target.id === form_selectHrId && !this.applicant.hrId) {
        target.value = '';
      }
      if (target.id === form_selectMentorId && !this.applicant.mentorId) {
        target.value = '';
      }
      if (target.id === form_selectTutorId && !this.applicant.tutorId) {
        target.value = '';
      }
    }

    if (
      this.keysPressed[83] &&
      this.keysPressed[78] &&
      this.keysPressed[65] &&
      !this._isLoading()
    ) {
      if (!this.snamiHeaders && this.potokHeaders) {
        const snamiServerType = this.snamiServerType ? (this.snamiServerType === 1 ? 2 : 0) : 1;
        storageSync.set({ snamiServerType }, () => {
          this.snamiServerType = snamiServerType;
          apiSnami.setBaseUrl(
            snamiServerType
              ? snamiServerType === 1
                ? BASE_URL_SNAMI_STAGE
                : BASE_URL_SNAMI_RC
              : BASE_URL_SNAMI_PROD
          );
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
    if (
      value &&
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
            this.applicant.tutorId = '';
            this.snamiHRList = [];
            this.snamiMentorsList = [];
            this.snamiTutorsList = [];
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
        // Do nothing
        break;
      case form_selectMentorId:
        // Do nothing
        break;
      case form_inputBirthday:
        this.applicant.birthday = Datepicker.formatDate(detail.date, 'dd.mm.yyyy');
        break;
      case form_inputStartedDate:
        this.applicant.startedDate = Datepicker.formatDate(detail.date, 'dd.mm.yyyy');
        break;
      case form_inputSex:
        this.applicant.sex = !!value;
        this._hideFormItemError(form_inputSex);
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
      requestSnamiCustomerInfo().then(([r1, r2]) => {
        if (r1.data && r2.data) {
          this.snamiCustomerName = r1?.data?.name || r2?.data?.name || '';
          this.snamiCustomerEmail = r1?.data?.user?.login || r2?.data?.user?.login || '';
          resolve();
        } else {
          if (r1.status >= 401 || r2.status >= 401) {
            this._logOutSnami().then(() => {
              resolve();
            });
          } else {
            reject(`${r1.problem} ${r2.problem}`);
          }
        }
      });
    });
  };

  _getPotokCustomerInfo = () => {
    return new Promise((resolve, reject) => {
      requestPotokCustomerInfo().then(({ data, problem, status }) => {
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
      chrome.tabs.query({active: true, windowId: chrome.windows.WINDOW_ID_CURRENT}, tab => {
        const { url } = tab[0];
        let jobId = '';
        let applicantId = '';
        // https://app.potok.io/applicants/6755512/
        // https://app.potok.io/jobs/189190/6167883
        // https://app.potok.io/jobs/189190/stage/1515235/6167883
        // https://app.potok.io/jobs/189190/stage/all/?applicantId=6167883
        // https://app.potok.io/j/189190/all/a/6750265/
        if (/app.potok.io\/applicants\/\d+/.test(url)) {
          const ids = url.match(/\d+/g);
          applicantId = ids[0];
        }
        if (
          /app.potok.io\/jobs\/\d+\/\d+/.test(url) ||
          /app.potok.io\/\D+\/\d+\/\D+\/\d+/.test(url)
        ) {
          const ids = url.match(/\d+/g);
          jobId = ids[0];
          applicantId = ids[1];
        }
        if (
          /app.potok.io\/\D+\/\d+\/\d+\/\D+\/\d+/.test(url) ||
          /app.potok.io\/jobs\/\d+\/stage\/\d+\/\d+/.test(url)
        ) {
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
        if (applicantId || (jobId && applicantId)) {
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
                planned_employment_date: startedDate = '',
              } = data;
              const validPhone = phone ? `7${String(phone).slice(-10)}` : '';
              const formattedBirthday =
                birthday && moment(birthday, 'YYYY-MM-DD').format('DD.MM.YYYY');
              const formattedStartedDate =
                startedDate && moment(startedDate, 'YYYY-MM-DD').format('DD.MM.YYYY');
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
                tutorId: '',
                position: '',
                salary: '',
                vacation: '',
                conditions: '',
                startedDate: formattedStartedDate ? formattedStartedDate : '',
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
                      tutor_id: tutorId = 0,
                      position = '',
                      meta: { salary = '', vacation_days: vacation = 0, conditions = '' } = {},
                      editMode,
                    } = staffByPotokId;
                    if (staffBirthday) {
                      staffBirthday = moment(staffBirthday, 'YYYY-MM-DD').format('DD.MM.YYYY');
                    }
                    if (startedDate) {
                      startedDate = moment(startedDate, 'YYYY-MM-DD').format('DD.MM.YYYY');
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
                      tutorId,
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
              resolve({
                ...staff,
                editMode: state === 'BUSY',
                isFree: state === 'NEW' || state === 'FREE',
              });
            } else {
              resolve(undefined);
            }
          } else {
            const name = `${staff?.last_name || ''} ${staff?.first_name ||
              ''} ${staff?.middle_name || ''}`;
            reject(
              `Кандидат ${name} уже адаптируется в ${
                customer?.is_own ? 'вашей' : 'другой'
              } компании.`
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
      requestSnamiStaffList({}).then(({ data, problem }) => {
        if (data) {
          this.snamiHRList = data;
          this.snamiMentorsList = data;
          this.snamiTutorsList = data;
          resolve();
        } else {
          reject(problem);
        }
      });
    });
  };
}

var app = new App();
