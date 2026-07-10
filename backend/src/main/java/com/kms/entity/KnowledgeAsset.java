package com.kms.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.util.List;
import java.time.LocalDateTime;

@Entity
@Data
public class KnowledgeAsset {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;
    private String category;
    private String knowledgeType;
    
    @ElementCollection
    private List<String> tags;
    
    @Column(columnDefinition = "TEXT")
    private String summary;
    
    @Column(columnDefinition = "TEXT")
    private String detailedContent;
    
    private String severityLevel;
    
    @Column(columnDefinition = "TEXT")
    private String rootCause;
    
    private String attachmentUrl;
    
    // Status can be: Pending, Approved, Rejected, Investigating
    private String status = "Pending";
    
    private String author;
    private String reviewer;
    
    @Column(columnDefinition = "TEXT")
    private String reviewerNotes;
    
    private Integer versionControl = 1;
    
    private String version = "v1.0";
    
    private Integer helpfulCount = 0;
    
    @ElementCollection
    @Column(columnDefinition = "TEXT")
    private List<String> proposedUpdates;

    @ElementCollection
    @Column(columnDefinition = "TEXT")
    private List<String> approvedUpdates;
    
    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    public void setUpdatedAt() {
        this.updatedAt = LocalDateTime.now();
    }
}
