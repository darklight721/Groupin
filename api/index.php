<?php

require 'Slim/Slim.php';

$app = new Slim();

$app->get('/groupin/:id', 'getGroupin');
$app->get('/groupin/:id/:passcode', 'checkPasscode');
$app->post('/groupin', 'addGroupin');
$app->put('/groupin/:id', 'updateGroupin');

$app->run();

function getGroupin($id) {
	$sql = "SELECT id, entities, groups FROM groupin WHERE id=:id";
	try {
		$db = getConnection();
		$stmt = $db->prepare($sql);
		$stmt->bindParam("id", $id);
		$stmt->execute();
		$groupin = $stmt->fetchObject();
		$db = null;
		echo json_encode($groupin);
	} catch(PDOException $e) {
		echo '{"error":{"text":'. $e->getMessage() .'}}';
	}
}

function checkPasscode($id,$passcode) {
	$sql = "SELECT id, entities, groups, edit_passcode FROM groupin WHERE id=:id and edit_passcode=:passcode";
	try {
		$db = getConnection();
		$stmt = $db->prepare($sql);
		$stmt->bindParam("id", $id);
		$stmt->bindParam("passcode", $passcode);
		$stmt->execute();
		$groupin = $stmt->fetchObject();
		$db = null;
		echo json_encode($groupin);
	} catch(PDOException $e) {
		echo '{"error":{"text":'. $e->getMessage() .'}}';
	}
}

function addGroupin() {
	$request = Slim::getInstance()->request();
	$groupin = json_decode($request->getBody());
	$sql = "INSERT INTO groupin (entities, groups, edit_passcode) VALUES (:entities, :groups, :edit_passcode)";
	try {
		$edit_passcode = generateRandString(8);

		$db = getConnection();
		$stmt = $db->prepare($sql);
		$stmt->bindParam("entities", $groupin->entities);
		$stmt->bindParam("groups", $groupin->groups);
		$stmt->bindParam("edit_passcode", $edit_passcode);
		$stmt->execute();
		$groupin->id = $db->lastInsertId();
		$groupin->edit_passcode = $edit_passcode;
		$db = null;
		echo json_encode($groupin);
	} catch(PDOException $e) {
		echo '{"error":{"text":'. $e->getMessage() .'}}';
	}
}

function updateGroupin($id) {
	$request = Slim::getInstance()->request();
	$body = $request->getBody();
	$groupin = json_decode($body);
	$sql = "UPDATE groupin SET entities=:entities, groups=:groups, edit_passcode=:new_edit_passcode where id=:id and edit_passcode=:edit_passcode";
	try {
		$db = getConnection();
		$stmt = $db->prepare($sql);
		$stmt->bindParam("entities", $groupin->entities);
		$stmt->bindParam("groups", $groupin->groups);
		$stmt->bindParam("id", $id);
		if (isset($groupin->new_edit_passcode))
			$stmt->bindParam("new_edit_passcode", $groupin->new_edit_passcode);
		else
			$stmt->bindParam("new_edit_passcode", $groupin->edit_passcode);
		$stmt->bindParam("edit_passcode", $groupin->edit_passcode);
		$stmt->execute();
		$db = null;
		echo json_encode($groupin);
	} catch(PDOException $e) {
		echo '{"error":{"text":'. $e->getMessage() .'}}';
	}
}

function getConnection() {
	$dbhost = "localhost";
	$dbuser = "root";
	$dbpass = "1234";
	$dbname = "groupin";
	$dbh = new PDO("mysql:host=$dbhost;dbname=$dbname", $dbuser, $dbpass);
	$dbh->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
	return $dbh;
}

function generateRandString($length) {
	$chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

	$size = strlen($chars);
	$str = "";
	for ($i = 0; $i < $length; $i++) {
		$str .= $chars[rand(0,$size-1)];
	}

	return $str;
}

?>