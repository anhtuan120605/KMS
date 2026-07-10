package com.kms.service;

import com.kms.entity.KnowledgeAsset;
import com.kms.repository.KnowledgeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class KnowledgeService {

    @Autowired
    private KnowledgeRepository repository;

    public KnowledgeAsset saveKnowledgeAsset(KnowledgeAsset asset) {
        // If it's a troubleshooting case, status defaults to "Investigating"
        if ("Troubleshooting Cases".equals(asset.getCategory())) {
            asset.setStatus("Investigating");
        } else if (asset.getStatus() == null || asset.getStatus().isEmpty()) {
            asset.setStatus("Pending");
        }
        return repository.save(asset);
    }

    public List<KnowledgeAsset> getKnowledgeAssets(String category, String status, String search) {
        List<KnowledgeAsset> assets;
        if (search != null && !search.isEmpty()) {
            if ("Approved".equals(status)) {
                assets = repository.searchByKeywordAndStatus(search, null);
                assets = assets.stream().filter(a -> "Approved".equals(a.getStatus()) || "Investigating".equals(a.getStatus())).toList();
            } else {
                assets = repository.searchByKeywordAndStatus(search, status);
            }
            if (category != null && !category.isEmpty() && !category.equalsIgnoreCase("All")) {
                assets = assets.stream()
                        .filter(a -> category.equalsIgnoreCase(a.getCategory()))
                        .toList();
            }
        } else if (category != null && !category.isEmpty() && !category.equalsIgnoreCase("All") && status != null && !status.isEmpty()) {
            if ("Approved".equals(status)) {
                List<KnowledgeAsset> app = repository.findByCategoryAndStatus(category, "Approved");
                List<KnowledgeAsset> inv = repository.findByCategoryAndStatus(category, "Investigating");
                assets = new java.util.ArrayList<>();
                assets.addAll(app);
                assets.addAll(inv);
            } else {
                assets = repository.findByCategoryAndStatus(category, status);
            }
        } else if (category != null && !category.isEmpty() && !category.equalsIgnoreCase("All")) {
            assets = repository.findByCategory(category);
        } else if (status != null && !status.isEmpty()) {
            if ("Approved".equals(status)) {
                List<KnowledgeAsset> app = repository.findByStatus("Approved");
                List<KnowledgeAsset> inv = repository.findByStatus("Investigating");
                assets = new java.util.ArrayList<>();
                assets.addAll(app);
                assets.addAll(inv);
            } else {
                assets = repository.findByStatus(status);
            }
        } else {
            assets = repository.findAll();
        }
        return assets;
    }

    public KnowledgeAsset reviewKnowledgeAsset(Long id, String status, String reviewer, String reviewerNotes) {
        Optional<KnowledgeAsset> optionalAsset = repository.findById(id);
        if (optionalAsset.isPresent()) {
            KnowledgeAsset asset = optionalAsset.get();
            asset.setStatus(status);
            if (reviewer != null) {
                asset.setReviewer(reviewer);
            }
            if (reviewerNotes != null) {
                asset.setReviewerNotes(reviewerNotes);
            }
            return repository.save(asset);
        }
        throw new RuntimeException("Knowledge Asset not found with ID: " + id);
    }

    public KnowledgeAsset updateKnowledgeAsset(Long id, KnowledgeAsset assetDetails) {
        Optional<KnowledgeAsset> optionalAsset = repository.findById(id);
        if (optionalAsset.isPresent()) {
            KnowledgeAsset asset = optionalAsset.get();
            if (assetDetails.getTitle() != null) asset.setTitle(assetDetails.getTitle());
            if (assetDetails.getSummary() != null) asset.setSummary(assetDetails.getSummary());
            if (assetDetails.getDetailedContent() != null) asset.setDetailedContent(assetDetails.getDetailedContent());
            if (assetDetails.getCategory() != null) asset.setCategory(assetDetails.getCategory());
            if (assetDetails.getKnowledgeType() != null) asset.setKnowledgeType(assetDetails.getKnowledgeType());
            if (assetDetails.getSeverityLevel() != null) asset.setSeverityLevel(assetDetails.getSeverityLevel());
            if (assetDetails.getRootCause() != null) asset.setRootCause(assetDetails.getRootCause());
            if (assetDetails.getStatus() != null) asset.setStatus(assetDetails.getStatus());
            if (assetDetails.getVersion() != null) asset.setVersion(assetDetails.getVersion());
            if (assetDetails.getHelpfulCount() != null) asset.setHelpfulCount(assetDetails.getHelpfulCount());
            if (assetDetails.getProposedUpdates() != null) asset.setProposedUpdates(assetDetails.getProposedUpdates());
            if (assetDetails.getApprovedUpdates() != null) asset.setApprovedUpdates(assetDetails.getApprovedUpdates());
            return repository.save(asset);
        }
        throw new RuntimeException("Knowledge Asset not found with ID: " + id);
    }

    public KnowledgeAsset incrementHelpfulCount(Long id) {
        Optional<KnowledgeAsset> optionalAsset = repository.findById(id);
        if (optionalAsset.isPresent()) {
            KnowledgeAsset asset = optionalAsset.get();
            asset.setHelpfulCount((asset.getHelpfulCount() != null ? asset.getHelpfulCount() : 0) + 1);
            return repository.save(asset);
        }
        throw new RuntimeException("Knowledge Asset not found with ID: " + id);
    }

    public KnowledgeAsset addWorkspaceComment(Long id, String username, String commentText) {
        Optional<KnowledgeAsset> optionalAsset = repository.findById(id);
        if (optionalAsset.isPresent()) {
            KnowledgeAsset asset = optionalAsset.get();
            String timestamp = java.time.format.DateTimeFormatter.ISO_INSTANT.format(java.time.Instant.now());
            String commentString = username + "|" + timestamp + "|" + commentText;
            
            List<String> updates = asset.getProposedUpdates();
            if (updates == null) {
                updates = new java.util.ArrayList<>();
            }
            updates.add(commentString);
            asset.setProposedUpdates(updates);
            return repository.save(asset);
        }
        throw new RuntimeException("Knowledge Asset not found with ID: " + id);
    }

    public void deleteKnowledgeAsset(Long id) {
        repository.deleteById(id);
    }
}
