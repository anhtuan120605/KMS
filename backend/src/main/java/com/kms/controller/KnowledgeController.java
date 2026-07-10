package com.kms.controller;

import com.kms.entity.KnowledgeAsset;
import com.kms.service.KnowledgeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/knowledge")
@CrossOrigin(origins = "*") // Allow frontend to call APIs
public class KnowledgeController {

    @Autowired
    private KnowledgeService service;

    @PostMapping
    public ResponseEntity<KnowledgeAsset> submitKnowledge(@RequestBody KnowledgeAsset asset) {
        KnowledgeAsset savedAsset = service.saveKnowledgeAsset(asset);
        return new ResponseEntity<>(savedAsset, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<KnowledgeAsset>> getKnowledge(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search) {
        List<KnowledgeAsset> assets = service.getKnowledgeAssets(category, status, search);
        return new ResponseEntity<>(assets, HttpStatus.OK);
    }

    @PutMapping("/{id}/review")
    public ResponseEntity<KnowledgeAsset> reviewKnowledge(
            @PathVariable Long id,
            @RequestBody Map<String, String> reviewData) {
        String status = reviewData.get("status");
        String reviewer = reviewData.get("reviewer");
        String reviewerNotes = reviewData.get("reviewerNotes");

        try {
            KnowledgeAsset updatedAsset = service.reviewKnowledgeAsset(id, status, reviewer, reviewerNotes);
            return new ResponseEntity<>(updatedAsset, HttpStatus.OK);
        } catch (RuntimeException e) {
            return new ResponseEntity<>(null, HttpStatus.NOT_FOUND);
        }
    }

    @PutMapping("/{id}/apply")
    public ResponseEntity<KnowledgeAsset> incrementHelpfulCount(@PathVariable Long id) {
        try {
            KnowledgeAsset updated = service.incrementHelpfulCount(id);
            return new ResponseEntity<>(updated, HttpStatus.OK);
        } catch (RuntimeException e) {
            return new ResponseEntity<>(null, HttpStatus.NOT_FOUND);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<KnowledgeAsset> updateKnowledge(
            @PathVariable Long id,
            @RequestBody KnowledgeAsset assetDetails) {
        try {
            KnowledgeAsset updatedAsset = service.updateKnowledgeAsset(id, assetDetails);
            return new ResponseEntity<>(updatedAsset, HttpStatus.OK);
        } catch (RuntimeException e) {
            return new ResponseEntity<>(null, HttpStatus.NOT_FOUND);
        }
    }

    @PutMapping("/{id}/comment")
    public ResponseEntity<KnowledgeAsset> addComment(
            @PathVariable Long id,
            @RequestBody Map<String, String> commentData) {
        String username = commentData.get("username");
        String commentText = commentData.get("commentText");
        try {
            KnowledgeAsset updated = service.addWorkspaceComment(id, username, commentText);
            return new ResponseEntity<>(updated, HttpStatus.OK);
        } catch (RuntimeException e) {
            return new ResponseEntity<>(null, HttpStatus.NOT_FOUND);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteKnowledge(@PathVariable Long id) {
        try {
            service.deleteKnowledgeAsset(id);
            return new ResponseEntity<>(Map.of("message", "Knowledge Asset deleted successfully"), HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(Map.of("message", "Error deleting Knowledge Asset"), HttpStatus.BAD_REQUEST);
        }
    }
}
