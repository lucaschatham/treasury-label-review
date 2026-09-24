"""Adapt only the final style projection, preserving pretrained features."""
def constrain(head):
    for parameter in head[0].parameters():
        parameter.requires_grad_(False)
    return head
