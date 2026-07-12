package com.kms;

import com.kms.entity.User;
import com.kms.repository.UserRepository;
import com.kms.service.UserService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class KmsApplication {

	public static void main(String[] args) {
		SpringApplication.run(KmsApplication.class, args);
	}

	@Bean
	public CommandLineRunner initAdmin(
			UserRepository userRepository, 
			UserService userService, 
			com.kms.repository.KnowledgeRepository knowledgeRepository,
			javax.sql.DataSource dataSource) {
		return args -> {
			// 1. Run DDL & Data Migrations via direct JDBC connection
			try (java.sql.Connection conn = dataSource.getConnection();
				 java.sql.Statement stmt = conn.createStatement()) {
				System.out.println("Running structural SQL migrations on Supabase Database...");
				
				// Alter users table
				stmt.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS position VARCHAR(255);");
				stmt.execute("ALTER TABLE users ALTER COLUMN role TYPE VARCHAR(255);");
				
				// Drop constraints if exists
				stmt.execute("ALTER TABLE users DROP CONSTRAINT IF EXISTS chk_users_role;");
				stmt.execute("ALTER TABLE users DROP CONSTRAINT IF EXISTS chk_users_position;");
				
				// Add check constraints
				stmt.execute("ALTER TABLE users ADD CONSTRAINT chk_users_role CHECK (role IN ('JUNIOR', 'SENIOR', 'MANAGER', 'ADMINISTRATOR'));");
				stmt.execute("ALTER TABLE users ADD CONSTRAINT chk_users_position CHECK (position IN ('FIRMWARE', 'HARDWARE', 'FLIGHT'));");
				
				// Alter knowledge_asset table
				stmt.execute("ALTER TABLE knowledge_asset ADD COLUMN IF NOT EXISTS author_role VARCHAR(255);");
				stmt.execute("ALTER TABLE knowledge_asset ADD COLUMN IF NOT EXISTS author_position VARCHAR(255);");
				
				// Drop constraints if exists
				stmt.execute("ALTER TABLE knowledge_asset DROP CONSTRAINT IF EXISTS chk_ka_author_role;");
				stmt.execute("ALTER TABLE knowledge_asset DROP CONSTRAINT IF EXISTS chk_ka_author_position;");
				
				// Add check constraints
				stmt.execute("ALTER TABLE knowledge_asset ADD CONSTRAINT chk_ka_author_role CHECK (author_role IN ('JUNIOR', 'SENIOR', 'MANAGER', 'ADMINISTRATOR'));");
				stmt.execute("ALTER TABLE knowledge_asset ADD CONSTRAINT chk_ka_author_position CHECK (author_position IN ('FIRMWARE', 'HARDWARE', 'FLIGHT'));");
				
				// Data migrations: migrate roles for existing users
				stmt.execute("UPDATE users SET role = 'ADMINISTRATOR', position = 'FIRMWARE' WHERE role = 'Administrator' OR role = 'ADMIN' OR username = 'admin';");
				stmt.execute("UPDATE users SET role = 'SENIOR', position = 'FIRMWARE' WHERE role = 'Senior Engineer' OR username = 'senior';");
				stmt.execute("UPDATE users SET role = 'MANAGER', position = 'FIRMWARE' WHERE role = 'Project Manager' OR username = 'manager';");
				stmt.execute("UPDATE users SET role = 'JUNIOR', position = 'FLIGHT' WHERE role = 'Flight Test Pilot' OR username = 'pilot';");
				
				// Migrate roles for existing assets
				stmt.execute("UPDATE knowledge_asset SET author_role = 'SENIOR', author_position = 'FIRMWARE' WHERE author LIKE '%|Senior Engineer' OR author = 'Senior Engineer';");
				stmt.execute("UPDATE knowledge_asset SET author_role = 'JUNIOR', author_position = 'FIRMWARE' WHERE author LIKE '%|Firmware Engineer' OR author = 'Firmware Engineer';");
				stmt.execute("UPDATE knowledge_asset SET author_role = 'JUNIOR', author_position = 'HARDWARE' WHERE author LIKE '%|Hardware Engineer' OR author = 'Hardware Engineer';");
				stmt.execute("UPDATE knowledge_asset SET author_role = 'JUNIOR', author_position = 'FLIGHT' WHERE author LIKE '%|Flight Test Pilot' OR author = 'Flight Test Pilot';");
				stmt.execute("UPDATE knowledge_asset SET author_role = 'MANAGER', author_position = 'FIRMWARE' WHERE author LIKE '%|Project Manager' OR author = 'Project Manager';");
				
				// Ensure defaults for any null values
				stmt.execute("UPDATE users SET role = 'JUNIOR' WHERE role IS NULL OR role NOT IN ('JUNIOR', 'SENIOR', 'MANAGER', 'ADMINISTRATOR');");
				stmt.execute("UPDATE users SET position = 'FIRMWARE' WHERE position IS NULL OR position NOT IN ('FIRMWARE', 'HARDWARE', 'FLIGHT');");
				stmt.execute("UPDATE knowledge_asset SET author_role = 'JUNIOR' WHERE author_role IS NULL;");
				stmt.execute("UPDATE knowledge_asset SET author_position = 'FIRMWARE' WHERE author_position IS NULL;");
				
				// Clean up author legacy format
				stmt.execute("UPDATE knowledge_asset SET author = split_part(author, '|', 1);");
				
				System.out.println("SQL structural migrations completed successfully on Supabase.");
			} catch (Exception e) {
				System.err.println("Database migration failed: " + e.getMessage());
			}

			if (userRepository.findByUsername("admin").isEmpty()) {
				User admin = new User();
				admin.setUsername("admin");
				admin.setPassword("admin123");
				admin.setRole(com.kms.entity.Role.ADMINISTRATOR);
				admin.setPosition(com.kms.entity.Position.FIRMWARE);
				userService.createUser(admin);
				System.out.println("Default admin user created: admin / admin123 (ADMINISTRATOR)");
			}

			if (userRepository.findByUsername("senior").isEmpty()) {
				User senior = new User();
				senior.setUsername("senior");
				senior.setPassword("senior123");
				senior.setRole(com.kms.entity.Role.SENIOR);
				senior.setPosition(com.kms.entity.Position.FIRMWARE);
				userService.createUser(senior);
				System.out.println("Default senior user created: senior / senior123 (SENIOR)");
			}

			if (userRepository.findByUsername("manager").isEmpty()) {
				User manager = new User();
				manager.setUsername("manager");
				manager.setPassword("manager123");
				manager.setRole(com.kms.entity.Role.MANAGER);
				manager.setPosition(com.kms.entity.Position.FIRMWARE);
				userService.createUser(manager);
				System.out.println("Default manager user created: manager / manager123 (MANAGER)");
			}

			if (userRepository.findByUsername("pilot").isEmpty()) {
				User pilot = new User();
				pilot.setUsername("pilot");
				pilot.setPassword("pilot123");
				pilot.setRole(com.kms.entity.Role.JUNIOR);
				pilot.setPosition(com.kms.entity.Position.FLIGHT);
				userService.createUser(pilot);
				System.out.println("Default pilot user created: pilot / pilot123 (JUNIOR - FLIGHT)");
			}

			if (knowledgeRepository.count() == 0) {
				// Seed SOP & Checklist
				com.kms.entity.KnowledgeAsset sop1 = new com.kms.entity.KnowledgeAsset();
				sop1.setTitle("IMU Sensor Calibration Procedure (Accelerometer & Gyroscope)");
				sop1.setCategory("SOP & Checklist");
				sop1.setKnowledgeType("Procedure");
				sop1.setTags(java.util.List.of("IMU", "Sensor", "Calibration"));
				sop1.setSummary("This SOP outlines the standard lab method for 6-axis calibration of accelerometer and gyroscope sensors on Pixhawk v6X controllers to prevent pitch/roll bias.");
				sop1.setSeverityLevel("High");
				sop1.setAuthor("senior");
				sop1.setAuthorRole(com.kms.entity.Role.SENIOR);
				sop1.setAuthorPosition(com.kms.entity.Position.FIRMWARE);
				sop1.setStatus("Approved");
				knowledgeRepository.save(sop1);

				com.kms.entity.KnowledgeAsset sop2 = new com.kms.entity.KnowledgeAsset();
				sop2.setTitle("Magnetometer Calibration Procedure (Compass)");
				sop2.setCategory("SOP & Checklist");
				sop2.setKnowledgeType("Procedure");
				sop2.setTags(java.util.List.of("Magnetometer", "Compass", "Calibration"));
				sop2.setSummary("Instructions for calibrating the primary compass module outdoors away from metallic structures. Explains onboard mag calibration steps.");
				sop2.setSeverityLevel("Medium");
				sop2.setAuthor("senior");
				sop2.setAuthorRole(com.kms.entity.Role.SENIOR);
				sop2.setAuthorPosition(com.kms.entity.Position.FIRMWARE);
				sop2.setStatus("Approved");
				knowledgeRepository.save(sop2);

				// Seed Maintenance Logs
				com.kms.entity.KnowledgeAsset maint1 = new com.kms.entity.KnowledgeAsset();
				maint1.setTitle("ESC Motor Desync Fix & Main Power Distribution Board Repair");
				maint1.setCategory("Maintenance Logs");
				maint1.setKnowledgeType("Maintenance Log");
				maint1.setTags(java.util.List.of("ESC", "PDB", "Power", "Hardware"));
				maint1.setSummary("Detailed repair log for fixing an ESC desync issue on drone frame #04. Replaced motor 3 signal wire and soldered new capacitors to main power distribution board.");
				maint1.setSeverityLevel("Critical");
				maint1.setAuthor("senior");
				maint1.setAuthorRole(com.kms.entity.Role.SENIOR);
				maint1.setAuthorPosition(com.kms.entity.Position.HARDWARE);
				maint1.setStatus("Approved");
				knowledgeRepository.save(maint1);

				// Seed Lessons Learned from Troubleshooting Cases (July 1st)
				com.kms.entity.KnowledgeAsset trouble1 = new com.kms.entity.KnowledgeAsset();
				trouble1.setTitle("Compass Drift Issue Caused by High Electromagnetic Interference");
				trouble1.setCategory("Lessons Learned");
				trouble1.setKnowledgeType("Lessons Learned");
				trouble1.setTags(java.util.List.of("Compass", "Drift", "EMI", "Telemetry"));
				trouble1.setSummary("Drone drifted aggressively in LOITER mode. Root cause identified as magnetic field interference from the battery lead wires running too close to the GPS compass mast.");
				trouble1.setSeverityLevel("High");
				trouble1.setRootCause("High current flow from battery cables created a localized magnetic field that saturated the magnetometer sensor.");
				trouble1.setAuthor("pilot");
				trouble1.setAuthorRole(com.kms.entity.Role.JUNIOR);
				trouble1.setAuthorPosition(com.kms.entity.Position.FLIGHT);
				trouble1.setStatus("Approved");
				knowledgeRepository.save(trouble1);

				com.kms.entity.KnowledgeAsset trouble2 = new com.kms.entity.KnowledgeAsset();
				trouble2.setTitle("Quadcopter Motor 2 desync during high throttle punch-outs");
				trouble2.setCategory("Lessons Learned");
				trouble2.setKnowledgeType("Lessons Learned");
				trouble2.setTags(java.util.List.of("ESC", "Motor", "Desync", "BLHeli"));
				trouble2.setSummary("Motor 2 stopped spinning for 200ms during dynamic climb, leading to a sudden roll flip. Solved by increasing motor timing to 'Medium-High' and demag compensation to 'High' in BLHeli_32.");
				trouble2.setSeverityLevel("Critical");
				trouble2.setRootCause("Back EMF detection lost due to high motor speed and low motor timing config.");
				trouble2.setAuthor("senior");
				trouble2.setAuthorRole(com.kms.entity.Role.SENIOR);
				trouble2.setAuthorPosition(com.kms.entity.Position.FIRMWARE);
				trouble2.setStatus("Approved");
				knowledgeRepository.save(trouble2);

				// Seed Lessons Learned
				com.kms.entity.KnowledgeAsset lesson1 = new com.kms.entity.KnowledgeAsset();
				lesson1.setTitle("Dynamic Harmonic Notch Filter Configuration for Frame Vibration Suppression");
				lesson1.setCategory("Lessons Learned");
				lesson1.setKnowledgeType("Lessons Learned");
				lesson1.setTags(java.util.List.of("Filter", "Vibration", "Harmonic", "FFT"));
				lesson1.setSummary("Lessons learned configuring the dynamic double-notch filter based on esc telemetry rpm feed. Reduced D-term noise by 18dB and solved motor heating issues.");
				lesson1.setSeverityLevel("Medium");
				lesson1.setAuthor("senior");
				lesson1.setAuthorRole(com.kms.entity.Role.SENIOR);
				lesson1.setAuthorPosition(com.kms.entity.Position.FIRMWARE);
				lesson1.setStatus("Approved");
				knowledgeRepository.save(lesson1);

				// Seed Training & Regulation
				com.kms.entity.KnowledgeAsset train1 = new com.kms.entity.KnowledgeAsset();
				train1.setTitle("Onboarding Self-Study Guide for R&D Drone Flight Engineers");
				train1.setCategory("Training & Regulation");
				train1.setKnowledgeType("Training");
				train1.setTags(java.util.List.of("Onboarding", "Training", "Guide"));
				train1.setSummary("This onboarding manual provides references to local airspace restrictions, safety guidelines for battery storage, and an overview of standard flight logging software (Mission Planner).");
				train1.setSeverityLevel("Low");
				train1.setAuthor("manager");
				train1.setAuthorRole(com.kms.entity.Role.MANAGER);
				train1.setAuthorPosition(com.kms.entity.Position.FIRMWARE);
				train1.setStatus("Approved");
				knowledgeRepository.save(train1);

				System.out.println("Drone KMS Initial Seeding Completed.");
			}
		};
	}
}
