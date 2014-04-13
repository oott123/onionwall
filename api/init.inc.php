<?php
	$config = false;
	if(is_file('config.inc.php')){
		$config = require 'config.inc.php';
	}else{
		$config = require 'config_example.inc.php';
	}
	require 'NotORM.php';
	require 'curl.class.php';
	$db = new NotORM(new PDO(
			$config['db']['dsn'],$config['db']['usr'],$config['db']['pwd']
			,array(PDO::MYSQL_ATTR_INIT_COMMAND => 'SET NAMES '.$config['db']['cst']))
		,new NotORM_Structure_Convention('id','%s_id','%s',$config['db']['pre']));
	global $db;
	function save_meta($key,$value){
		global $db;
		$db->meta()->insert_update(array('id'=>$key),array('value'=>$value));
	}
	function get_meta($key){
		global $db;
		return $db->meta[$key]['value'];
	}
	function save_item($data){
		global $db;
		$db->items()->insert(array(
			'name'=>$data['name']
			,'avatar'=>$data['avatar']
			,'message'=>$data['message']
			));
	}