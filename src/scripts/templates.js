'use strict';

const form_authSnami = 'auth_snami';
const form_authPotok = 'auth_potok';
const form_candidate = 'candidate_create';
const id_logoutSnami = 'logout_snami';
const id_logoutPotok = 'logout_potok';
const id_linkCheckpoints = 'link_checkpoints';
const form_inputFirstName = 'input_firstName';
const form_inputLastName = 'input_lastName';
const form_inputMiddleName = 'input_middleName';
const form_inputBirthday = 'input_birthday';
const form_inputSex = 'input_sex';
const form_inputPhone = 'input_phone';
const form_inputEmail = 'input_email';
const form_selectIocationId = 'input_locationId';
const form_selectHrId = 'select_hrId';
const form_selectMentorId = 'select_mentorId';
const form_inputPosition = 'input_position';
const form_inputSalary = 'input_salary';
const form_inputVacation = 'input_vacation';
const form_inputConditions = 'input_conditions';
const form_inputStartedTime = 'input_startedTime';
const form_inputStartedDate = 'input_startedDate';
const form_submitCandidate = 'form_submitCandidate';
const loginSnami = '';
const passwordSnami = '';
const loginPotok = '';
const passwordPotok = '';

const getAuthForm = ({ formName, companyName, companyLogo } = {}) => {
  return `
    <section class="auth">
      <h1>Вход</h1>
      <h3>Для адаптации сотрудников необходимо войти в приложения Potok и Snami</h3>
      <div class="form-logo-container">
        <img src="${companyLogo}" alt="${companyName}" class="form-logo"/>
      </div>
      <form name="${formName}">
        <div class="form-item">
          <label class="form-label" htmlFor="login">Логин</label>
          <input class="form-input" id="login" name="login" type="text" placeholder="Логин" value="${
            formName == form_authSnami ? loginSnami : loginPotok
          }" />
        </div>
        <div class="form-item">
          <label class="form-label" htmlFor="password">Пароль</label>
          <input class="form-input" id="password" name="password" type="password" placeholder="Пароль" value="${
            formName == form_authSnami ? passwordSnami : passwordPotok
          }" />
        </div>
        <div id="auth-error"></div>
        <div class="form-footer">
          <button type="submit" class="form-button">
            Войти
          </button>
        </div>
      </form>
    </section>
  `;
};

const template_authSnami = getAuthForm({
  formName: form_authSnami,
  companyName: 'Snami',
  companyLogo: './images/logo_snami.svg',
});
const template_authPotok = getAuthForm({
  formName: form_authPotok,
  companyName: 'Potok',
  companyLogo: './images/logo_potok.svg',
});

const getCustomerBox = ({ avatar, name, email, logoutId }) => {
  return `
    <div class="customer-container">
      <img src="${avatar}" class="customer-avatar" alt=""/>
      <div class="customer-info">
        ${name ? `<div class="customer-name">${name}</div>` : ''}
        ${email ? `<div class="customer-email">${email}</div>` : ''}
      </div>
      <a class="customer-exit-button" id="${logoutId}">
        <img src="./images/exit.svg" class="customer-exit-icon" alt=""/>
      </a>
    </div>
  `;
};

const template_header = ({ snamiName, snamiEmail, potokName, potokEmail } = {}) => {
  if ((snamiName && snamiEmail) || (potokName && potokEmail)) {
    return `
    <header>
      ${
        snamiName && snamiEmail
          ? getCustomerBox({
              avatar: './images/avatar_snami.svg',
              name: snamiName,
              email: snamiEmail,
              logoutId: id_logoutSnami,
            })
          : ''
      }
      ${
        snamiName && snamiEmail && potokName && potokEmail
          ? '<div class="customers-separator"></div>'
          : ''
      }
      ${
        potokName && potokEmail
          ? getCustomerBox({
              avatar: './images/avatar_potok.svg',
              name: potokName,
              email: potokEmail,
              logoutId: id_logoutPotok,
            })
          : ''
      }
    </header>
  `;
  } else {
    return '';
  }
};

const template_candidateForm = ({
  firstName = '',
  lastName = '',
  middleName = '',
  sex = null,
  birthday = '',
  email = '',
  phone = '',
  locations = [],
  locationId = 0,
  HRsList = [],
  hrId = 0,
  mentorsList = [],
  mentorId = 0,
  position = '',
  salary = '',
  vacation = '',
  conditions = '',
  startedDate = '',
  startedTime = '',
}) => {
  return `
    <section class="candidate">
      <h1>Приглашение на адаптацию в Snami для сотрудника</h1>
      <form name="${form_candidate}">
        <div class="form-row">
          <div class="form-item">
            <label class="form-label required" htmlFor="${form_inputLastName}">Фамилия</label>
            <input class="form-input" id="${form_inputLastName}" name="${form_inputLastName}" type="text" placeholder="Фамилия" value="${lastName}" />
            <div id="${form_inputLastName}_error"></div>
          </div>
          <div class="form-item-separator"></div>
          <div class="form-item">
            <label class="form-label required" htmlFor="${form_inputFirstName}">Имя</label>
            <input class="form-input" id="${form_inputFirstName}" name="${form_inputFirstName}" type="text" placeholder="Имя" value="${firstName}" />
            <div id="${form_inputFirstName}_error"></div>
          </div>
          <div class="form-item-separator"></div>
          <div class="form-item">
            <label class="form-label" htmlFor="${form_inputMiddleName}">Отчество</label>
            <input class="form-input" id="${form_inputMiddleName}" name="${form_inputMiddleName}" type="text" placeholder="Отчество" value="${middleName}" />
          </div>
        </div>
        <div class="form-row">
          <div class="form-item">
            <label class="form-label" htmlFor="${form_inputBirthday}">Дата рождения</label>
            <input class="form-input" id="${form_inputBirthday}" name="${form_inputBirthday}" type="text" placeholder="ДД.MM.ГГГГ" value="${birthday}" />
          </div>
          <div class="form-item-separator"></div>
          <div class="form-item">
            <label class="form-label required" htmlFor="phone">Пол</label>
            <div class="form-radios">
              <label><input name="${form_inputSex}" type="radio" value="0" ${
    sex === true ? 'checked' : ''
  }><span class="checkmark"></span> Мужской</label>
              <label><input name="${form_inputSex}" type="radio" value="1"  ${
    sex === false ? 'checked' : ''
  }><span class="checkmark"></span> Женский</label>
            </div>
            <div id="${form_inputSex}_error"></div>
          </div>
        </div>
        <div class="form-row">
          <div class="form-item">
            <label class="form-label required" htmlFor="${form_inputPhone}">Телефон</label>
            <input class="form-input" id="${form_inputPhone}" name="${form_inputPhone}" type="text" placeholder="+7 999 999-99-99" value="${phone}" />
            <div id="${form_inputPhone}_error"></div>
          </div>
          <div class="form-item-separator"></div>
          <div class="form-item">
            <label class="form-label" htmlFor="${form_inputEmail}">E-mail</label>
            <input class="form-input" id="${form_inputEmail}" name="${form_inputEmail}" type="text" placeholder="E-mail" value="${email}" />
            <div id="${form_inputEmail}_error"></div>
          </div>
        </div>
        <div class="form-row">
          <div class="form-item">
            <label class="form-label required" htmlFor="${form_selectIocationId}">Локация</label>
            <select name="${form_selectIocationId}" id="${form_selectIocationId}">
              <option value="">Выберите локацию</option>
              ${locations
                .map(
                  ({ id, name }) =>
                    `<option value="${id}" ${
                      +locationId === +id ? 'selected' : ''
                    }>${name}</option>`,
                )
                .join()}
            </select>
            <div id="${form_selectIocationId}_error"></div>
          </div>
          <div class="form-item-separator"></div>
          <div class="form-item">
            <a class="form-link" id="${id_linkCheckpoints}">Посмотреть схему чекпоинтов доступных локаций</a>
          </div>
        </div>

        <div class="form-row">
          <div class="form-item">
            <label class="form-label required" htmlFor="${form_selectHrId}">HR</label>
            <select name="${form_selectHrId}" id="${form_selectHrId}">
              <option value="">Выберите HR</option>
              ${HRsList.map(
                ({ id, last_name, first_name, middle_name }) =>
                  `<option value="${id}" ${
                    +hrId === +id ? 'selected' : ''
                  }>${last_name} ${first_name} ${middle_name}</option>`,
              ).join()}
            </select>
            <div id="${form_selectHrId}_error"></div>
          </div>
          <div class="form-item-separator"></div>
          <div class="form-item">
            <label class="form-label required" htmlFor="${form_selectMentorId}">Наставник</label>
            <select name="${form_selectMentorId}" id="${form_selectMentorId}">
              <option value="">Выберите наставника</option>
              ${mentorsList
                .map(
                  ({ id, last_name, first_name, middle_name }) =>
                    `<option value="${id}" ${
                      +mentorId === +id ? 'selected' : ''
                    }>${last_name} ${first_name} ${middle_name}</option>`,
                )
                .join()}
            </select>
            <div id="${form_selectMentorId}_error"></div>
          </div>
        </div>

        <div class="form-row">
          <div class="form-item">
            <label class="form-label" htmlFor="${form_inputPosition}">Должность</label>
            <input class="form-input" id="${form_inputPosition}" name="${form_inputPosition}" type="text" placeholder="Должность" value="${position}" />
          </div>
          <div class="form-item-separator"></div>
          <div class="form-item">
            <label class="form-label" htmlFor="${form_inputSalary}">Зарплата</label>
            <input class="form-input" id="${form_inputSalary}" name="${form_inputSalary}" type="text" placeholder="Зарплата" value="${salary}" />
          </div>
          <div class="form-item-separator"></div>
          <div class="form-item">
            <label class="form-label" htmlFor="${form_inputVacation}">Дней отпуска</label>
            <input class="form-input" id="${form_inputVacation}" name="${form_inputVacation}" type="text" placeholder="Дней отпуска" value="${vacation}" />
          </div>
        </div>

        <div class="form-row">
          <div class="form-item">
            <label class="form-label" htmlFor="${form_inputConditions}">Условия работы</label>
            <input class="form-input" id="${form_inputConditions}" name="${form_inputConditions}" type="text" placeholder="Условия работы" value="${conditions}" />
          </div>
          <div class="form-item-separator"></div>
          <div class="form-item">
            <label class="form-label" htmlFor="${form_inputStartedDate}">Дата выхода</label>
            <input class="form-input" id="${form_inputStartedDate}" name="${form_inputStartedDate}" type="text" placeholder="ДД.MM.ГГГГ" value="${startedDate}"  />
            <div id="${form_inputStartedDate}_error"></div>
          </div>
          <div class="form-item-separator"></div>
          <div class="form-item">
            <label class="form-label" htmlFor="${form_inputStartedTime}">Время выхода</label>
            <input class="form-input" id="${form_inputStartedTime}" name="${form_inputStartedTime}" type="text" placeholder="00:00"  value="${startedTime}"/>
            <div id="${form_inputStartedTime}_error"></div>
          </div>
        </div>

        <div class="form-footer">
          <div id="${form_submitCandidate}_error"></div>
          <button type="submit" class="form-button">
            Отправить приглашение
          </button>
        </div>
      </form>
    </section>
  `;
};

const template_appInfo = info => {
  return `
    <section class="info">
      <img class="info-image" src="./images/info.svg" alt=""/>
      <div class="info-text">${info}</div>
    </section>
  `;
};
