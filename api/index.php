<?php

require 'Slim/Slim.php';

$app = new Slim();

$app->get('/groupin/:id', 'getGroupin');
$app->post('/groupin', 'addGroupin');

$app->run();

function getGroupin($id) {
	$sql = "SELECT * FROM groupin WHERE id=:id";
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

function addGroupin() {
	$request = Slim::getInstance()->request();
	$groupin = json_decode($request->getBody());
	$sql = "INSERT INTO groupin (entities, groups) VALUES (:entities, :groups)";
	try {
		$db = getConnection();
		$stmt = $db->prepare($sql);
		$stmt->bindParam("entities", $groupin->entities);
		$stmt->bindParam("groups", $groupin->groups);
		$stmt->execute();
		//$groupin->id = $db->lastInsertId();
		$db = null;
		echo json_decode($groupin);
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

?>