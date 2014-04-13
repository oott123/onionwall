<?php
	require 'init.inc.php';
	$id = intval($_GET['since_id']);
	$items = $db->items()->select('*')->limit(100,$id);
	$json['err_msg'] = 'success';
	$json['items'] = array();
	foreach ($items as $id => $item) {
		$json['items'][] = array('name'=>$item['name'],'avatar'=>$item['avatar'],'message'=>$item['message']);
		$json['max_id'] = $id;
	}
	header('Content-Type: application/json');
	echo json_encode($json);
