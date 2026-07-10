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
	public CommandLineRunner initAdmin(UserRepository userRepository, UserService userService, com.kms.repository.KnowledgeRepository knowledgeRepository) {
		return args -> {
			if (userRepository.findByUsername("admin").isEmpty()) {
				User admin = new User();
				admin.setUsername("admin");
				admin.setPassword("admin123");
				admin.setRole("Administrator");
				userService.createUser(admin);
				System.out.println("Default admin user created: admin / admin123 (Administrator)");
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
				sop1.setAuthor("Senior Engineer");
				sop1.setStatus("Approved");
				knowledgeRepository.save(sop1);

				com.kms.entity.KnowledgeAsset sop2 = new com.kms.entity.KnowledgeAsset();
				sop2.setTitle("Magnetometer Calibration Procedure (Compass)");
				sop2.setCategory("SOP & Checklist");
				sop2.setKnowledgeType("Procedure");
				sop2.setTags(java.util.List.of("Magnetometer", "Compass", "Calibration"));
				sop2.setSummary("Instructions for calibrating the primary compass module outdoors away from metallic structures. Explains onboard mag calibration steps.");
				sop2.setSeverityLevel("Medium");
				sop2.setAuthor("Firmware Engineer");
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
				maint1.setAuthor("Hardware Engineer");
				maint1.setStatus("Approved");
				knowledgeRepository.save(maint1);

				// Seed Troubleshooting Cases
				com.kms.entity.KnowledgeAsset trouble1 = new com.kms.entity.KnowledgeAsset();
				trouble1.setTitle("Compass Drift Issue Caused by High Electromagnetic Interference");
				trouble1.setCategory("Troubleshooting Cases");
				trouble1.setKnowledgeType("Troubleshooting");
				trouble1.setTags(java.util.List.of("Compass", "Drift", "EMI", "Telemetry"));
				trouble1.setSummary("Drone drifted aggressively in LOITER mode. Root cause identified as magnetic field interference from the battery lead wires running too close to the GPS compass mast.");
				trouble1.setSeverityLevel("High");
				trouble1.setRootCause("High current flow from battery cables created a localized magnetic field that saturated the magnetometer sensor.");
				trouble1.setAuthor("Flight Test Pilot");
				trouble1.setStatus("Approved");
				knowledgeRepository.save(trouble1);

				com.kms.entity.KnowledgeAsset trouble2 = new com.kms.entity.KnowledgeAsset();
				trouble2.setTitle("Quadcopter Motor 2 desync during high throttle punch-outs");
				trouble2.setCategory("Troubleshooting Cases");
				trouble2.setKnowledgeType("Troubleshooting");
				trouble2.setTags(java.util.List.of("ESC", "Motor", "Desync", "BLHeli"));
				trouble2.setSummary("Motor 2 stopped spinning for 200ms during dynamic climb, leading to a sudden roll flip. Solved by increasing motor timing to 'Medium-High' and demag compensation to 'High' in BLHeli_32.");
				trouble2.setSeverityLevel("Critical");
				trouble2.setRootCause("Back EMF detection lost due to high motor speed and low motor timing config.");
				trouble2.setAuthor("Firmware Engineer");
				trouble2.setStatus("Pending");
				knowledgeRepository.save(trouble2);

				// Seed Lessons Learned
				com.kms.entity.KnowledgeAsset lesson1 = new com.kms.entity.KnowledgeAsset();
				lesson1.setTitle("Dynamic Harmonic Notch Filter Configuration for Frame Vibration Suppression");
				lesson1.setCategory("Lessons Learned");
				lesson1.setKnowledgeType("Lessons Learned");
				lesson1.setTags(java.util.List.of("Filter", "Vibration", "Harmonic", "FFT"));
				lesson1.setSummary("Lessons learned configuring the dynamic double-notch filter based on esc telemetry rpm feed. Reduced D-term noise by 18dB and solved motor heating issues.");
				lesson1.setSeverityLevel("Medium");
				lesson1.setAuthor("Firmware Engineer");
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
				train1.setAuthor("Project Manager");
				train1.setStatus("Approved");
				knowledgeRepository.save(train1);

				System.out.println("Drone KMS Initial Seeding Completed.");
			}
		};
	}
}
