<?php
$captcha_verification = !empty($_POST['captcha_verification']) ? $_POST['captcha_verification'] : false;
if ($captcha_verification !== false) {
    $data = [
        "endpoint" => "verify",
        "captcha_verification" => $captchaVerification,
        "captcha_difficulty" => $captcha_difficulty
    ];
   
    $c = curl_init();
    curl_setopt($c, CURLOPT_URL, 'https://wehatecaptchas.com/api.php');
    curl_setopt($c, CURLOPT_HEADER, 0);
    curl_setopt($c, CURLOPT_POST, 1);
    curl_setopt($c, CURLOPT_POSTFIELDS, http_build_query($data));
    curl_setopt($c, CURLOPT_RETURNTRANSFER, 1);
    $response = json_decode(curl_exec($c), true);
    curl_close($c);
    $verify = $response["data"]["verified"];
} else {
    $verify = false;
}

return $verify;
?>
