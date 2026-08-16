def check_eligibility(student, job):
    reasons = []

    if float(student.cgpa) < float(job.min_cgpa):
        reasons.append(f"CGPA {student.cgpa} is below required minimum {job.min_cgpa}")

    if student.backlogs > job.max_backlogs:
        reasons.append(f"{student.backlogs} active backlog(s) exceed allowed maximum {job.max_backlogs}")

    if job.allowed_branches:
        allowed = [b.strip() for b in job.allowed_branches.split(",")]
        if student.branch not in allowed:
            reasons.append(f"Branch '{student.branch}' is not in allowed branches: {job.allowed_branches}")

    return {
        "eligible": len(reasons) == 0,
        "reasons": reasons,
    }