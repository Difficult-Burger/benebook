-- MySQL dump 10.13  Distrib 9.3.0, for macos15.2 (arm64)
--
-- Host: localhost    Database: benebook
-- ------------------------------------------------------
-- Server version	8.0.32

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `Book`
--

DROP TABLE IF EXISTS `Book`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Book` (
  `book_id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `author` varchar(100) DEFAULT NULL,
  `publisher` varchar(100) DEFAULT NULL,
  `category` varchar(50) DEFAULT NULL,
  `image_url` varchar(255) DEFAULT NULL,
  `location` varchar(50) DEFAULT NULL,
  `original_price` decimal(10,2) NOT NULL,
  `condition_ratio` decimal(3,2) DEFAULT '1.00',
  `unsold_count` int DEFAULT '0',
  PRIMARY KEY (`book_id`),
  KEY `idx_book_location` (`location`),
  KEY `idx_book_unsold` (`unsold_count`),
  KEY `idx_book_title_prefix` (`title`(20)),
  KEY `idx_book_author_prefix` (`author`(15)),
  KEY `idx_book_category` (`category`),
  CONSTRAINT `book_chk_1` CHECK ((`condition_ratio` between 0.00 and 1.00))
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Book`
--

LOCK TABLES `Book` WRITE;
/*!40000 ALTER TABLE `Book` DISABLE KEYS */;
INSERT INTO `Book` VALUES (1,'哈利·波特与魔法石','J.K.罗琳','人民文学出版社','奇幻',NULL,NULL,59.90,1.00,0),(2,'三体','刘慈欣','重庆出版社','科幻',NULL,NULL,49.80,0.95,0),(3,'百年孤独','加西亚·马尔克斯','南海出版公司','文学',NULL,NULL,39.50,0.90,0),(4,'活着','余华','作家出版社','文学',NULL,NULL,25.00,0.85,0),(5,'明朝那些事儿','当年明月','中国友谊出版公司','历史',NULL,NULL,99.00,1.00,0),(6,'小王子','安托万·德·圣-埃克苏佩里','人民文学出版社','童话',NULL,NULL,22.00,1.00,0),(7,'解忧杂货店','东野圭吾','南海出版公司','小说',NULL,NULL,39.50,0.90,0),(8,'哈利·波特与魔法石','J.K.罗琳','人民文学出版社','奇幻',NULL,NULL,59.90,1.00,0),(9,'三体','刘慈欣','重庆出版社','科幻',NULL,NULL,49.80,0.95,0),(10,'百年孤独','加西亚·马尔克斯','南海出版公司','文学',NULL,NULL,39.50,0.90,0),(11,'活着','余华','作家出版社','文学',NULL,NULL,25.00,0.85,0),(12,'明朝那些事儿','当年明月','中国友谊出版公司','历史',NULL,NULL,99.00,1.00,0),(13,'小王子','安托万·德·圣-埃克苏佩里','人民文学出版社','童话',NULL,NULL,22.00,1.00,0),(14,'解忧杂货店','东野圭吾','南海出版公司','小说',NULL,NULL,39.50,0.90,0),(15,'哈利·波特与魔法石','J.K.罗琳','人民文学出版社','奇幻',NULL,NULL,59.90,1.00,0),(16,'三体','刘慈欣','重庆出版社','科幻',NULL,NULL,49.80,0.95,0),(17,'百年孤独','加西亚·马尔克斯','南海出版公司','文学',NULL,NULL,39.50,0.90,0),(18,'活着','余华','作家出版社','文学',NULL,NULL,25.00,0.85,0),(19,'明朝那些事儿','当年明月','中国友谊出版公司','历史',NULL,NULL,99.00,1.00,0);
/*!40000 ALTER TABLE `Book` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Donation`
--

DROP TABLE IF EXISTS `Donation`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Donation` (
  `donation_id` int NOT NULL AUTO_INCREMENT,
  `donor_phone` varchar(20) NOT NULL,
  `book_id` int NOT NULL,
  `donation_quantity` int NOT NULL,
  `donation_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`donation_id`),
  KEY `idx_donation_donor` (`donor_phone`),
  KEY `idx_donation_book` (`book_id`),
  KEY `idx_donation_time` (`donation_time`),
  KEY `idx_donor_phone_time` (`donor_phone`,`donation_time`),
  KEY `idx_donation_book_donor_qty` (`book_id`,`donor_phone`,`donation_quantity`),
  CONSTRAINT `donation_ibfk_1` FOREIGN KEY (`donor_phone`) REFERENCES `Donor` (`donor_phone`),
  CONSTRAINT `donation_ibfk_2` FOREIGN KEY (`book_id`) REFERENCES `Book` (`book_id`),
  CONSTRAINT `donation_chk_1` CHECK ((`donation_quantity` > 0))
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Donation`
--

LOCK TABLES `Donation` WRITE;
/*!40000 ALTER TABLE `Donation` DISABLE KEYS */;
INSERT INTO `Donation` VALUES (1,'13800138000',2,1,'2025-04-19 18:12:09'),(2,'110',3,10,'2025-04-19 18:15:50'),(3,'110',1,1,'2025-04-19 18:17:03'),(4,'110',3,2,'2025-04-20 05:25:32'),(5,'110',4,2,'2025-04-20 05:26:24'),(6,'110',2,10,'2025-04-20 05:27:32'),(7,'11111110',3,10,'2025-04-20 05:40:24'),(8,'110',7,1,'2025-04-20 05:52:58');
/*!40000 ALTER TABLE `Donation` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `UpdatePointsAfterDonation` AFTER INSERT ON `donation` FOR EACH ROW BEGIN
  DECLARE points_per_book INT;
  SELECT config_value INTO points_per_book 
  FROM SystemConfig WHERE config_key = 'POINTS_PER_BOOK';
  
  UPDATE Donor
  SET total_points = total_points + (NEW.donation_quantity * points_per_book)
  WHERE donor_phone = NEW.donor_phone;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `Donor`
--

DROP TABLE IF EXISTS `Donor`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Donor` (
  `donor_phone` varchar(20) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `nickname` varchar(50) NOT NULL,
  `wechat_id` varchar(50) DEFAULT NULL,
  `payment_qr` varchar(255) DEFAULT NULL,
  `total_points` int DEFAULT '0',
  PRIMARY KEY (`donor_phone`),
  UNIQUE KEY `idx_unique_email` (`email`),
  UNIQUE KEY `idx_unique_wechat` (`wechat_id`),
  KEY `idx_donor_nickname` (`nickname`),
  KEY `idx_donor_points` (`total_points`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Donor`
--

LOCK TABLES `Donor` WRITE;
/*!40000 ALTER TABLE `Donor` DISABLE KEYS */;
INSERT INTO `Donor` VALUES ('110','11@qq.com','lcdk','123',NULL,190),('11111110','lcdk111@qq.com','lcdk111','lcdk1111',NULL,0),('123','123@qq.com','123','1234',NULL,0),('13800138000','test@example.com','测试用户','test123',NULL,10);
/*!40000 ALTER TABLE `Donor` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Redemption`
--

DROP TABLE IF EXISTS `Redemption`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Redemption` (
  `redemption_id` int NOT NULL AUTO_INCREMENT,
  `donor_phone` varchar(20) NOT NULL,
  `item_id` int NOT NULL,
  `redeem_quantity` int NOT NULL,
  `redeem_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`redemption_id`),
  KEY `donor_phone` (`donor_phone`),
  KEY `idx_redemption_time` (`redeem_time`),
  KEY `idx_redemption_item` (`item_id`),
  CONSTRAINT `redemption_ibfk_1` FOREIGN KEY (`donor_phone`) REFERENCES `Donor` (`donor_phone`),
  CONSTRAINT `redemption_ibfk_2` FOREIGN KEY (`item_id`) REFERENCES `RewardItem` (`item_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Redemption`
--

LOCK TABLES `Redemption` WRITE;
/*!40000 ALTER TABLE `Redemption` DISABLE KEYS */;
INSERT INTO `Redemption` VALUES (1,'110',1,1,'2025-04-22 12:38:15'),(2,'110',2,1,'2025-04-22 12:51:18'),(3,'11111110',1,2,'2025-04-22 13:36:15');
/*!40000 ALTER TABLE `Redemption` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `RewardItem`
--

DROP TABLE IF EXISTS `RewardItem`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `RewardItem` (
  `item_id` int NOT NULL AUTO_INCREMENT,
  `item_name` varchar(255) NOT NULL,
  `image_url` varchar(255) DEFAULT NULL,
  `required_points` int NOT NULL,
  `stock` int DEFAULT '0',
  `redeemed_count` int DEFAULT '0',
  PRIMARY KEY (`item_id`),
  KEY `idx_reward_points` (`required_points`,`stock`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `RewardItem`
--

LOCK TABLES `RewardItem` WRITE;
/*!40000 ALTER TABLE `RewardItem` DISABLE KEYS */;
INSERT INTO `RewardItem` VALUES (1,'环保购物袋',NULL,50,97,3),(2,'环保购物袋',NULL,20,49,1),(3,'纸质笔记本',NULL,30,30,0),(4,'创意书签套装',NULL,15,100,0),(5,'咖啡杯',NULL,50,20,0),(6,'植物盆栽',NULL,45,15,0);
/*!40000 ALTER TABLE `RewardItem` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `SystemConfig`
--

DROP TABLE IF EXISTS `SystemConfig`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `SystemConfig` (
  `config_key` varchar(50) NOT NULL,
  `config_value` decimal(10,2) DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`config_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `SystemConfig`
--

LOCK TABLES `SystemConfig` WRITE;
/*!40000 ALTER TABLE `SystemConfig` DISABLE KEYS */;
INSERT INTO `SystemConfig` VALUES ('CO2_PER_BOOK',5.00,'每本书节省的碳排放（kg）'),('FUND_RATIO',0.05,'捐赠价值转换为公益基金的比例'),('LIFECYCLE_PER_BOOK',1.00,'每本书延长生命周期（年）'),('POINTS_PER_BOOK',10.00,'每捐赠1本书获得的积分'),('PRICE_DEPRECIATION_RATE',0.05,'滞销次数对定价的衰减系数（每次滞销衰减5%）'),('TREES_PER_BOOK',0.10,'每本书少砍伐的树木（棵）');
/*!40000 ALTER TABLE `SystemConfig` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ThankYouLetter`
--

DROP TABLE IF EXISTS `ThankYouLetter`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ThankYouLetter` (
  `letter_id` int NOT NULL AUTO_INCREMENT,
  `donation_id` int NOT NULL,
  `extended_lifecycle` decimal(10,2) DEFAULT NULL,
  `saved_co2` decimal(10,2) DEFAULT NULL,
  `saved_trees` decimal(10,2) DEFAULT NULL,
  `public_fund` decimal(10,2) DEFAULT NULL,
  PRIMARY KEY (`letter_id`),
  KEY `donation_id` (`donation_id`),
  CONSTRAINT `thankyouletter_ibfk_1` FOREIGN KEY (`donation_id`) REFERENCES `Donation` (`donation_id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ThankYouLetter`
--

LOCK TABLES `ThankYouLetter` WRITE;
/*!40000 ALTER TABLE `ThankYouLetter` DISABLE KEYS */;
INSERT INTO `ThankYouLetter` VALUES (1,1,1.00,5.00,0.10,2.49),(2,2,10.00,50.00,1.00,19.75),(3,3,1.00,5.00,0.10,3.00),(4,4,2.00,10.00,0.20,3.95),(5,5,2.00,10.00,0.20,2.50),(6,6,10.00,50.00,1.00,24.90),(7,7,10.00,50.00,1.00,19.75),(8,8,1.00,5.00,0.10,1.98);
/*!40000 ALTER TABLE `ThankYouLetter` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-04-22 21:58:55
