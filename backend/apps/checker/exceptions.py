from rest_framework import status
from rest_framework.exceptions import APIException


class Conflict(APIException):
    status_code = status.HTTP_409_CONFLICT
    default_detail = "Состояние задачи изменилось. Обновите страницу и попробуйте снова."
    default_code = "conflict"


class PayloadTooLarge(APIException):
    status_code = status.HTTP_413_REQUEST_ENTITY_TOO_LARGE
    default_detail = "Исходный код превышает допустимый размер."
    default_code = "source_too_large"


class CheckerUnavailable(APIException):
    status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    default_detail = "Проверка решений пока недоступна. Черновик можно сохранить."
    default_code = "checker_unavailable"
