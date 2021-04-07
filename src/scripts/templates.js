'use strict';

const form_authSnami = 'auth_snami';
const form_authPotok = 'auth_potok';
const form_authLogin = 'input_login';
const form_authPassword = 'input_password';
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
const form_selectLocationId = 'input_locationId';
const form_selectHrId = 'select_hrId';
const form_selectMentorId = 'select_mentorId';
const form_selectTutorId = 'select_tutorId';
const form_inputPosition = 'input_position';
const form_inputSalary = 'input_salary';
const form_inputVacation = 'input_vacation';
const form_inputConditions = 'input_conditions';
const form_inputStartedTime = 'input_startedTime';
const form_inputStartedDate = 'input_startedDate';
const form_submitCandidate = 'form_submitCandidate';

const getAuthForm = ({
  formName,
  companyName,
  companyExist,
  login = '',
  password = '',
  snamiServerType = 0,
  snamiTwoFactorAuth = false,
} = {}) => {
  return `
    <section class="auth">
      <h1>Вход</h1>
      <h3>Для адаптации сотрудников необходимо войти в приложения Potok и Snami</h3>
      ${
  companyExist
    ? `<h2>Вы успешно авторизованы в ${companyExist} <span class="check-icon blue"></span></h2>`
    : ''
}
      <h2>Выполните вход в ${companyName}${
  snamiServerType
    ? `&nbsp;&nbsp;&nbsp;<span class="text-red">[${
      snamiServerType === 1 ? 'STAGE' : 'RC'
    }]</span>`
    : ''
}</h2>
    ${
  formName === form_authSnami && login && password && snamiTwoFactorAuth
    ? `
        <section class="info small">
          <img class="info-image" src="./images/info.svg" alt=""/>
          <div class="info-text">Администратор вашей компании включил двухфакторную авторизацию</div>
          <div class="info-text">На e-mail аккаунта ${login} отправлена ссылка для авторизации</div>
          <div class="form-footer">
            <button type="button" class="form-button" id="${id_logoutSnami}">
              Сменить аккаунт
            </button>
          </div>
        </section>
        `
    : `
        <form name="${formName}">
          <div class="form-item">
            <label class="form-label" htmlFor="${form_authLogin}">Логин</label>
            <input class="form-input" id="${form_authLogin}" name="${form_authLogin}" type="text" placeholder="Логин" value="${login}" />
          </div>
          <div class="form-item">
            <label class="form-label" htmlFor="${form_authPassword}">Пароль</label>
            <input class="form-input" id="${form_authPassword}" name="${form_authPassword}" type="password" placeholder="Пароль" value="${password}" />
          </div>
          <div id="auth-error"></div>
          <div class="form-footer">
            <button type="submit" class="form-button">
              Войти
            </button>
          </div>
        </form>
      `
}
    </section>
  `;
};

const template_authSnami = ({
  login,
  password,
  otherCompanyExist,
  snamiServerType,
  snamiTwoFactorAuth,
}) => getAuthForm({
  login: login ? login : '',
  password: password ? password : '',
  formName: form_authSnami,
  companyName: 'Snami',
  companyExist: otherCompanyExist ? 'Potok' : null,
  snamiServerType: snamiServerType || 0,
  snamiTwoFactorAuth: snamiTwoFactorAuth || false,
});

const template_authPotok = ({ login, password, otherCompanyExist }) => getAuthForm({
  login: login ? login : '',
  password: password ? password : '',
  formName: form_authPotok,
  companyName: 'Potok',
  companyExist: otherCompanyExist ? 'Snami' : null,
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

const template_header = ({
  snamiName,
  snamiEmail,
  potokName,
  potokEmail,
  snamiServerType,
} = {}) => {
  if ((snamiName && snamiEmail) || (potokName && potokEmail)) {
    return `
    <header>
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
      ${
  snamiName && snamiEmail && potokName && potokEmail
    ? '<div class="customers-separator"></div>'
    : ''
}
      ${
  snamiName && snamiEmail
    ? getCustomerBox({
      avatar: snamiServerType
        ? snamiServerType === 1
          ? './images/avatar_snami_stage.svg'
          : './images/avatar_snami_rc.svg'
        : './images/avatar_snami.svg',
      name: snamiName,
      email: snamiEmail,
      logoutId: id_logoutSnami,
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
  editMode = false,
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
      <h1>${
  editMode
    ? 'Сотрудник уже проходит адаптацию <span class="check-icon green"></span>'
    : 'Приглашение на адаптацию в Snami для сотрудника'
}</h1>
      ${editMode ? '<h3>Вы можете редактировать данные профиля сотрудника</h3>' : ''}
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
              <label><input name="${form_inputSex}" type="radio" value="0" ${sex === true ? 'checked' : ''}>
              <span class="checkmark"></span> Мужской</label>
              <label><input name="${form_inputSex}" type="radio" value="1"  ${sex === false ? 'checked' : ''}>
              <span class="checkmark"></span> Женский</label>
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
            <label class="form-label required" htmlFor="${form_selectLocationId}">Локация</label>
            <select name="${form_selectLocationId}" id="${form_selectLocationId}">
              <option value="">Выберите локацию</option>
              ${locations
    .map(
      ({ id, name }) => `<option value="${id}" ${
        +locationId === +id ? 'selected' : ''
      }>${name}</option>`
    )
    .join()}
            </select>
            <div id="${form_selectLocationId}_error"></div>
          </div>
          <div class="form-item-separator"></div>
          <div class="form-item">
            <a class="form-link" id="${id_linkCheckpoints}">Посмотреть схему чекпоинтов доступных локаций</a>
          </div>
        </div>

        <div class="form-row">
          <div class="form-item">
            <label class="form-label required" htmlFor="${form_selectHrId}">HR</label>
            <div class="awesomplete">
                <input name="${form_selectHrId}" id="${form_selectHrId}" type="text" autocomplete="off"/>
            </div>
            <div id="${form_selectHrId}_error"></div>
          </div>
          <div class="form-item-separator"></div>
          <div class="form-item">
            <label class="form-label required" htmlFor="${form_selectMentorId}">Руководитель</label>
            <div class="awesomplete">
                <input name="${form_selectMentorId}" id="${form_selectMentorId}" type="text" autocomplete="off"/>
            </div>
            <div id="${form_selectMentorId}_error"></div>
          </div>
          <div class="form-item-separator"></div>
          <div class="form-item">
            <label class="form-label" htmlFor="${form_selectTutorId}">Наставник</label>
            <div class="awesomplete">
                <input name="${form_selectTutorId}" id="${form_selectTutorId}" type="text" autocomplete="off"/>
            </div>
            <div id="${form_selectTutorId}_error"></div>
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
            <label class="form-label" htmlFor="${form_inputConditions}">Условия/оборудование</label>
            <input class="form-input" id="${form_inputConditions}" name="${form_inputConditions}" type="text" placeholder="Условия/оборудование" value="${conditions}" />
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
            ${editMode ? 'Сохранить изменениия' : 'Отправить приглашение'}
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
