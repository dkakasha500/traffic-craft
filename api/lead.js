/* Алиас переходного периода: страницы из кеша до переименования шлют на
   /api/lead. Сам обработчик живет в api/request.js - имя без «lead»,
   которое клиентские блокировщики (EasyPrivacy-стиль правил вида
   /lead-tracking.min.js, /leadtag.js) не режут. Удалить через месяц. */
module.exports = require('./request.js');
module.exports.signToken = require('./request.js').signToken;
