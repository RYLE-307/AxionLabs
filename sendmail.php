<?php
// sendmail.php
header('Content-Type: application/json; charset=utf-8');

// Настройки
$to = 'info@axionlabs.ru'; // Ваш email
$subject = 'Новое сообщение с сайта AxionLabs';

// Получение данных из POST
$name = isset($_POST['from_name']) ? trim($_POST['from_name']) : '';
$company = isset($_POST['company']) ? trim($_POST['company']) : '';
$email = isset($_POST['from_email']) ? trim($_POST['from_email']) : '';
$phone = isset($_POST['phone']) ? trim($_POST['phone']) : '';
$message = isset($_POST['message']) ? trim($_POST['message']) : '';

// Валидация
if (!$name || !$company || !$email || !$phone || !$message) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Заполните все поля.']);
    exit;
}

// Формирование письма
$body = "Имя: $name\nКомпания: $company\nEmail: $email\nТелефон: $phone\n\nСообщение:\n$message";
$headers = "From: AxionLabs <no-reply@axionlabs.ru>\r\nReply-To: $email\r\nContent-Type: text/plain; charset=utf-8";

// Отправка
if (mail($to, $subject, $body, $headers)) {
    echo json_encode(['success' => true]);
} else {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Ошибка отправки письма.']);
}
